import { prisma } from "../src/lib/prisma";
import { PCStatus, ConsoleStatus, ConsoleType, SessionStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { listPCs, getPCById, updatePCStatus } from "../src/services/pc.service";
import { listConsoles, getConsoleById, createConsole, updateConsole, updateConsoleStatus, deleteConsole } from "../src/services/console.service";
import { listMembers, getMemberById, createMember, updateMember, deleteMember, searchMembers } from "../src/services/member.service";
import { startSession, stopSession, checkoutSession, getSessionById } from "../src/services/session.service";
import { getLowStockProducts, listProducts } from "../src/services/product.service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("DREAMCAFE BACKEND END-TO-END VERIFICATION SUITE");
  console.log("==================================================\n");

  // -------------------------------------------------------------------
  // TEST GROUP 1: PC MANAGEMENT
  // -------------------------------------------------------------------
  console.log("▶ TEST GROUP 1: PC Management");
  const pcs = await listPCs();
  assert(Array.isArray(pcs) && pcs.length > 0, `listPCs returned ${pcs.length} stations`);

  const pc01 = pcs.find((p) => p.stationNumber === "PC 01");
  assert(Boolean(pc01), "PC 01 found in station list");
  if (!pc01) return;

  const pcDetails = await getPCById(pc01.id);
  assert(pcDetails !== null && pcDetails.id === pc01.id, "getPCById returns station details");

  // Status transition validation
  let caughtInvalidManualInUse = false;
  try {
    // Attempting to manually set IN_USE without active session
    await updatePCStatus(pc01.id, PCStatus.IN_USE);
  } catch (err: unknown) {
    caughtInvalidManualInUse = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("IN_USE"), `Invalid manual transition to IN_USE prevented: "${msg}"`);
  }
  assert(caughtInvalidManualInUse, "Manual transition to IN_USE without session was rejected");

  console.log("  ✓ PC management assertions passed.\n");

  // -------------------------------------------------------------------
  // TEST GROUP 2: MEMBER SERVICE
  // -------------------------------------------------------------------
  console.log("▶ TEST GROUP 2: Member Service");
  const members = await listMembers();
  assert(Array.isArray(members) && members.length > 0, `listMembers returned ${members.length} members`);

  // Test create member with only required name (optional email/phone)
  const testName = `Tester Auto ${Date.now().toString().slice(-4)}`;
  const newMember = await createMember({
    fullName: testName,
  });
  assert(Boolean(newMember.id), `Member created with ID: ${newMember.id}`);
  assert(Boolean(newMember.memberCode.startsWith("DC-")), `Member code generated: ${newMember.memberCode}`);
  assert(newMember.phoneNumber === null, "Member phone number is null (optional)");
  assert(newMember.email === null, "Member email is null (optional)");
  assert(Boolean(newMember.username), `Username auto-generated: ${newMember.username}`);

  // Test search members
  const searchResults = await searchMembers(testName);
  assert(searchResults.some((m) => m.id === newMember.id), "searchMembers found the created member");

  // Test update member
  const updatedMember = await updateMember(newMember.id, {
    notes: "Verified test member",
  });
  assert(updatedMember.notes === "Verified test member", "updateMember successfully updated notes");

  // Test getMemberById with profile & spending calculation
  const memberDetails = await getMemberById(newMember.id);
  assert(memberDetails !== null && typeof memberDetails.totalSpending === "number", "getMemberById calculates totalSpending");

  console.log("  ✓ Member service assertions passed.\n");

  // -------------------------------------------------------------------
  // TEST GROUP 3: HAPPY PATH - SESSION LIFECYCLE & CASH CHECKOUT (12 STEPS)
  // -------------------------------------------------------------------
  console.log("▶ TEST GROUP 3: Happy Path — Session Lifecycle & Cash Checkout");

  // 1. Find an AVAILABLE PC
  const availablePC = await prisma.pC.findFirst({
    where: {
      status: PCStatus.AVAILABLE,
      sessions: { none: { status: SessionStatus.ACTIVE } },
    },
  });
  assert(Boolean(availablePC), `Step 1: Found AVAILABLE station: ${availablePC?.stationNumber}`);
  if (!availablePC) throw new Error("No available PC found");

  // 2. Find an existing member
  const existingMember = members[0];
  assert(Boolean(existingMember), `Step 2: Found member: ${existingMember.fullName} (${existingMember.memberCode})`);

  // Product to include in checkout
  const product = await prisma.product.findFirst({
    where: { stock: { gte: 5 }, isActive: true },
  });
  assert(Boolean(product), `Step 2b: Found product for checkout: ${product?.name} (Stock: ${product?.stock}, Price: Rp${product?.price})`);
  if (!product) throw new Error("No product found");

  const initialStock = product.stock;

  // 3. Start a session
  console.log(`  Starting session on ${availablePC.stationNumber} for ${existingMember.fullName}...`);
  const session = await startSession({
    stationId: availablePC.id,
    type: "PC",
    memberId: existingMember.id,
    durationMinutes: 60,
  });
  assert(Boolean(session.id), `Step 3: Session created: ${session.sessionNumber}`);

  // 4. Verify PC becomes IN_USE
  const pcAfterStart = await prisma.pC.findUnique({ where: { id: availablePC.id } });
  assert(pcAfterStart?.status === PCStatus.IN_USE, `Step 4: PC ${availablePC.stationNumber} status is now IN_USE`);

  // 5. Verify session becomes ACTIVE
  const sessionAfterStart = await getSessionById(session.id);
  assert(sessionAfterStart?.status === SessionStatus.ACTIVE, "Step 5: Session status is ACTIVE");

  // 6. Stop / Checkout the session with a product
  const productQty = 1;
  const sessionPrice = session.totalPrice; // 60 min rate
  const productSubtotal = product.price * productQty;
  const expectedTotal = sessionPrice + productSubtotal;
  const cashReceived = expectedTotal + 10000; // Overpay to test change calculation
  const expectedChange = 10000;

  console.log(`  Checking out session: Session Rp${sessionPrice} + ${product.name} Rp${productSubtotal} = Total Rp${expectedTotal}`);
  console.log(`  Cash received: Rp${cashReceived}, Expected change: Rp${expectedChange}`);

  const checkoutResult = await checkoutSession({
    sessionId: session.id,
    products: [
      {
        productId: product.id,
        quantity: productQty,
      },
    ],
    cashReceived,
    cashierName: "Test Cashier",
  });

  // 7. Verify transaction becomes PAID
  assert(checkoutResult.transaction.status === PaymentStatus.PAID, "Step 7: Transaction status is PAID");
  assert(checkoutResult.transaction.paymentMethod === PaymentMethod.CASH, "Step 7b: Payment method is CASH");

  // 8. Verify session becomes COMPLETED
  const sessionAfterCheckout = await getSessionById(session.id);
  assert(sessionAfterCheckout?.status === SessionStatus.COMPLETED, "Step 8: Session status is COMPLETED");
  assert(sessionAfterCheckout?.paymentStatus === PaymentStatus.PAID, "Step 8b: Session paymentStatus is PAID");

  // 9. Verify PC becomes AVAILABLE
  const pcAfterCheckout = await prisma.pC.findUnique({ where: { id: availablePC.id } });
  assert(pcAfterCheckout?.status === PCStatus.AVAILABLE, `Step 9: PC ${availablePC.stationNumber} status returned to AVAILABLE`);

  // 10. Verify transaction total
  assert(checkoutResult.totalAmount === expectedTotal, `Step 10: Transaction total is exactly Rp${expectedTotal}`);
  assert(checkoutResult.transaction.totalAmount === expectedTotal, `Step 10b: Saved transaction total amount is Rp${expectedTotal}`);

  // 11. Verify cash/change calculation
  assert(checkoutResult.cashChange === expectedChange, `Step 11: Change calculated is exactly Rp${expectedChange}`);

  // 12. Verify product stock decreased correctly
  const productAfterCheckout = await prisma.product.findUnique({ where: { id: product.id } });
  assert(
    productAfterCheckout?.stock === initialStock - productQty,
    `Step 12: Product stock decreased from ${initialStock} to ${productAfterCheckout?.stock}`
  );

  // Restore product stock so seed data remains intact
  await prisma.product.update({
    where: { id: product.id },
    data: { stock: initialStock },
  });
  console.log("  ✓ Product stock restored cleanly.");

  console.log("  ✓ All 12 happy path steps verified successfully!\n");

  // -------------------------------------------------------------------
  // TEST GROUP 4: ERROR CASES & RESILIENCE
  // -------------------------------------------------------------------
  console.log("▶ TEST GROUP 4: Error Cases & Controlled Validations");

  // Error Case 1: Start session on IN_USE PC
  // Find an IN_USE PC
  const inUsePC = await prisma.pC.findFirst({ where: { status: PCStatus.IN_USE } });
  if (inUsePC) {
    let caughtInUse = false;
    try {
      await startSession({
        stationId: inUsePC.id,
        durationMinutes: 30,
        guestName: "Guest Test",
      });
    } catch (err: unknown) {
      caughtInUse = true;
      const msg = err instanceof Error ? err.message : String(err);
      assert(msg.includes("IN_USE") || msg.includes("sedang"), `Error Case 1 (IN_USE PC): "${msg}"`);
    }
    assert(caughtInUse, "Starting session on IN_USE PC properly rejected");
  }

  // Error Case 2: Start session on MAINTENANCE PC
  const maintenancePC = await prisma.pC.findFirst({ where: { status: PCStatus.MAINTENANCE } });
  if (maintenancePC) {
    let caughtMaintenance = false;
    try {
      await startSession({
        stationId: maintenancePC.id,
        durationMinutes: 30,
        guestName: "Guest Test",
      });
    } catch (err: unknown) {
      caughtMaintenance = true;
      const msg = err instanceof Error ? err.message : String(err);
      assert(msg.includes("MAINTENANCE") || msg.includes("pemeliharaan"), `Error Case 2 (MAINTENANCE PC): "${msg}"`);
    }
    assert(caughtMaintenance, "Starting session on MAINTENANCE PC properly rejected");
  }

  // Error Case 3: Stop already completed session
  let caughtAlreadyCompleted = false;
  try {
    await stopSession(session.id);
  } catch (err: unknown) {
    caughtAlreadyCompleted = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("tidak aktif") || msg.includes("selesai"), `Error Case 3 (Already completed session): "${msg}"`);
  }
  assert(caughtAlreadyCompleted, "Stopping already completed session properly rejected");

  // Error Case 4: Checkout with insufficient cash
  // Start a short test session on available PC to test checkout error
  const sessionForCashError = await startSession({
    stationId: availablePC.id,
    durationMinutes: 30,
    guestName: "Cash Error Test",
  });

  let caughtInsufficientCash = false;
  try {
    await checkoutSession({
      sessionId: sessionForCashError.id,
      cashReceived: 100, // Insufficient!
    });
  } catch (err: unknown) {
    caughtInsufficientCash = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("kurang"), `Error Case 4 (Insufficient cash): "${msg}"`);
  }
  assert(caughtInsufficientCash, "Checkout with insufficient cash properly rejected");

  // Error Case 5: Checkout with insufficient product stock
  let caughtInsufficientStock = false;
  try {
    await checkoutSession({
      sessionId: sessionForCashError.id,
      products: [
        {
          productId: product.id,
          quantity: 999999, // Exceeds stock!
        },
      ],
      cashReceived: 999999999,
    });
  } catch (err: unknown) {
    caughtInsufficientStock = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("tidak mencukupi"), `Error Case 5 (Insufficient stock): "${msg}"`);
  }
  assert(caughtInsufficientStock, "Checkout with insufficient stock properly rejected");

  // Verify that failed checkouts did not corrupt the session or PC
  const sessionAfterFailedCheckout = await getSessionById(sessionForCashError.id);
  assert(sessionAfterFailedCheckout?.status === SessionStatus.ACTIVE, "Session remains ACTIVE after failed checkouts");
  const pcAfterFailedCheckout = await prisma.pC.findUnique({ where: { id: availablePC.id } });
  assert(pcAfterFailedCheckout?.status === PCStatus.IN_USE, "PC remains IN_USE after failed checkouts");

  // Now cleanly complete this test session
  await checkoutSession({
    sessionId: sessionForCashError.id,
    cashReceived: 50000,
  });
  console.log("  ✓ Test session cleaned up and checked out.");

  // Error Case 6: Invalid member ID
  let caughtInvalidMember = false;
  try {
    await startSession({
      stationId: availablePC.id,
      durationMinutes: 30,
      memberId: "invalid-member-id-12345",
    });
  } catch (err: unknown) {
    caughtInvalidMember = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("Member tidak ditemukan"), `Error Case 6 (Invalid Member ID): "${msg}"`);
  }
  assert(caughtInvalidMember, "Start session with invalid member ID rejected");

  // Error Case 7: Invalid PC ID
  let caughtInvalidPC = false;
  try {
    await startSession({
      stationId: "invalid-pc-id-12345",
      durationMinutes: 30,
      guestName: "Guest",
    });
  } catch (err: unknown) {
    caughtInvalidPC = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("PC Station tidak ditemukan"), `Error Case 7 (Invalid PC ID): "${msg}"`);
  }
  assert(caughtInvalidPC, "Start session with invalid PC ID rejected");

  console.log("  ✓ All error cases handled with controlled application errors.\n");

  // -------------------------------------------------------------------
  // TEST GROUP 5: PRODUCT & LOW-STOCK QUERIES
  // -------------------------------------------------------------------
  console.log("▶ TEST GROUP 5: Product & Inventory Queries");
  const lowStockProducts = await getLowStockProducts();
  assert(Array.isArray(lowStockProducts), `getLowStockProducts returned ${lowStockProducts.length} low-stock items`);

  const filteredLowStock = await listProducts({ lowStockOnly: true });
  assert(Array.isArray(filteredLowStock), `listProducts({ lowStockOnly: true }) returned ${filteredLowStock.length} items`);

  // -------------------------------------------------------------------
  // TEST GROUP 6: CONSOLE MANAGEMENT & SESSIONS
  // -------------------------------------------------------------------
  console.log("\n▶ TEST GROUP 6: Console Management & Sessions");
  const consoles = await listConsoles();
  assert(Array.isArray(consoles) && consoles.length > 0, `listConsoles returned ${consoles.length} console stations`);

  const con01 = consoles.find((c) => c.stationNumber === "CON 01");
  assert(Boolean(con01), "CON 01 found in station list");
  if (!con01) return;

  const conDetails = await getConsoleById(con01.id);
  assert(conDetails !== null && conDetails.id === con01.id, "getConsoleById returns console station details");

  // Create temporary test console
  const tempConStationNumber = `CON 9${Math.floor(Math.random() * 9)}`;
  const createdCon = await createConsole({
    stationNumber: tempConStationNumber,
    name: "PlayStation 5 Test Suite Station",
    consoleType: ConsoleType.PS5,
    status: ConsoleStatus.AVAILABLE,
    hourlyRate: 25000,
    controllersCount: 4,
    specsDisplay: 'LG OLED 55" 4K 120Hz Test',
    installedGames: ["EA Sports FC 24", "Tekken 8"],
  });
  assert(createdCon.stationNumber === tempConStationNumber, `createConsole created ${tempConStationNumber}`);

  // Update console
  const updatedCon = await updateConsole(createdCon.id, {
    hourlyRate: 30000,
    controllersCount: 2,
  });
  assert(updatedCon.hourlyRate === 30000, "updateConsole updated hourly rate to Rp30.000");

  // Validate manual transition to IN_USE without session is rejected
  let caughtConInvalidInUse = false;
  try {
    await updateConsoleStatus(createdCon.id, ConsoleStatus.IN_USE);
  } catch (err: unknown) {
    caughtConInvalidInUse = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("IN_USE"), `Invalid manual transition to IN_USE rejected: "${msg}"`);
  }
  assert(caughtConInvalidInUse, "Manual transition to IN_USE without session was properly rejected");

  // Test Console Session: Start session
  console.log(`  Starting console session on ${createdCon.stationNumber}...`);
  const conSession = await startSession({
    stationId: createdCon.id,
    type: "CONSOLE",
    guestName: "Console Tester",
    durationMinutes: 60,
    currentGame: "Tekken 8",
  });
  assert(Boolean(conSession.id), `Console session started: ${conSession.sessionNumber}`);

  // Verify console is now IN_USE
  const activeConCheck = await getConsoleById(createdCon.id);
  assert(activeConCheck?.status === ConsoleStatus.IN_USE, "Console status updated to IN_USE");
  assert(activeConCheck?.activeSession !== null, "Console reflects active session");

  // Verify duplicate active session rejection
  let caughtDuplicateCon = false;
  try {
    await startSession({
      stationId: createdCon.id,
      type: "CONSOLE",
      guestName: "Second Player",
      durationMinutes: 60,
    });
  } catch (err: unknown) {
    caughtDuplicateCon = true;
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes("IN_USE") || msg.includes("sesi aktif"), `Duplicate console session rejected: "${msg}"`);
  }
  assert(caughtDuplicateCon, "Duplicate active session on console was properly prevented");

  // Stop console session
  const stoppedConSession = await stopSession(conSession.id);
  assert(stoppedConSession.status === SessionStatus.COMPLETED, "Console session stopped and marked COMPLETED");

  // Verify console status returned to AVAILABLE
  const availableConCheck = await getConsoleById(createdCon.id);
  assert(availableConCheck?.status === ConsoleStatus.AVAILABLE, "Console status cleanly returned to AVAILABLE");

  // Delete temporary test console
  await deleteConsole(createdCon.id);
  const deletedCheck = await getConsoleById(createdCon.id);
  assert(deletedCheck === null, "Temporary console station cleaned up and deleted");
  // Clean up temporary member using deleteMember service
  await deleteMember(newMember.id);
  console.log("  ✓ Temporary test member cleanly deleted with deleteMember service.");

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================");
}

runTests()
  .catch((err) => {
    console.error("Test execution encountered an unhandled error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
