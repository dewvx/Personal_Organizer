require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');
const NoteModel = require('../models/noteModel');
const WalletModel = require('../models/walletModel');
const TransactionModel = require('../models/transactionModel');
const ReminderModel = require('../models/reminderModel');

async function runTests() {
  console.log('🧪 Starting Phase 1 Backend Verification Tests...');
  try {
    // 1. Test Notes
    console.log('\n--- 1. Testing Notes Module ---');
    const note = await NoteModel.create({
      title: 'ทดสอบบันทึกไอเดียใหม่',
      content: 'นี่คือเนื้อหาบันทึกสำหรับทดสอบระบบ Notes & Journal',
      note_type: 'journal',
      mood: 'great',
      tags: ['test', 'idea'],
      is_pinned: true,
      color: '#10B981',
    });
    console.log('✅ Created note:', note.id, note.title, note.mood);

    const foundNote = await NoteModel.findById(note.id);
    if (!foundNote || foundNote.title !== note.title) throw new Error('Find note failed');

    const listNotes = await NoteModel.findAll({ search: 'ไอเดีย' });
    if (listNotes.notes.length === 0) throw new Error('Note search failed');
    console.log('✅ Found notes via search:', listNotes.notes.length);

    await NoteModel.togglePin(note.id);
    console.log('✅ Toggled pin');

    const calendar = await NoteModel.getJournalCalendar({});
    console.log('✅ Journal calendar entries:', calendar.length);

    // 2. Test Finance
    console.log('\n--- 2. Testing Finance Module ---');
    const wallets = await WalletModel.findAll();
    console.log('✅ Existing wallets:', wallets.map(w => `${w.name} (${w.balance})`));

    const testWallet = await WalletModel.create({
      name: 'กระเป๋าเงินทดสอบ',
      type: 'e_wallet',
      balance: 1000,
      icon: 'smartphone',
      color: '#8B5CF6',
    });
    console.log('✅ Created test wallet with 1,000 balance:', testWallet.id);

    // Income transaction (+500)
    const income = await TransactionModel.create({
      wallet_id: testWallet.id,
      type: 'income',
      amount: 500,
      note: 'เงินเดือนพิเศษ',
    });
    console.log('✅ Created income tx:', income.amount);

    // Expense transaction (-200)
    const expense = await TransactionModel.create({
      wallet_id: testWallet.id,
      type: 'expense',
      amount: 200,
      note: 'ค่ากาแฟ',
    });
    console.log('✅ Created expense tx:', expense.amount);

    // Check updated wallet balance
    const updatedWallet = await WalletModel.findById(testWallet.id);
    console.log('✅ Wallet balance after income + expense (1000 + 500 - 200 = 1300):', updatedWallet.balance);
    if (updatedWallet.balance !== 1300) throw new Error(`Balance mismatch: expected 1300, got ${updatedWallet.balance}`);

    const summary = await TransactionModel.getSummary({ wallet_id: testWallet.id });
    console.log('✅ Finance summary:', summary);

    // Clean up test tx & wallet
    await TransactionModel.delete(income.id);
    await TransactionModel.delete(expense.id);
    await WalletModel.delete(testWallet.id);
    console.log('✅ Cleaned up test wallet & transactions.');

    // 3. Test Reminders
    console.log('\n--- 3. Testing Smart Reminders Module ---');
    const reminder = await ReminderModel.create({
      title: 'นัดประชุมโปรเจกต์',
      message: 'เตรียมสไลด์นำเสนอ',
      remind_at: new Date(Date.now() + 60000).toISOString(),
      repeat_type: 'none',
      note_id: note.id,
    });
    console.log('✅ Created reminder:', reminder.id, reminder.title);

    await ReminderModel.snooze(reminder.id, 10);
    console.log('✅ Snoozed reminder 10 mins');

    await ReminderModel.dismiss(reminder.id);
    console.log('✅ Dismissed reminder');

    await ReminderModel.delete(reminder.id);
    await NoteModel.delete(note.id);
    console.log('✅ Cleaned up reminder & note.');

    console.log('\n🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
