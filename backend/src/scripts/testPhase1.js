require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const assert = require('assert');
const { pool, withTransaction } = require('../config/database');
const EntryModel = require('../models/entryModel');
const SettingModel = require('../models/settingModel');
const CategoryModel = require('../models/categoryModel');
const HabitModel = require('../models/habitModel');
const GoalModel = require('../models/goalModel');
const AttachmentModel = require('../models/attachmentModel');
const PushModel = require('../models/pushModel');
const TemplateModel = require('../models/templateModel');
const NotificationService = require('../services/notificationService');
const DashboardService = require('../services/dashboardService');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('🧪 Starting Phase 1 Stabilization Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Test withTransaction rolls back on failure
  await test('STAB-01: withTransaction rollback preserves data integrity on error', async () => {
    let createdId = null;
    try {
      await withTransaction(async (client) => {
        const res = await client.query(
          `INSERT INTO entries (title, entry_date) VALUES ('Temporary Test Entry', CURRENT_DATE) RETURNING id`
        );
        createdId = res.rows[0].id;
        // Intentionally throw error to force rollback
        throw new Error('Simulated query failure during transaction');
      });
    } catch (err) {
      // Expected error
    }

    // Verify createdId does NOT exist in the database
    if (createdId) {
      const check = await pool.query('SELECT 1 FROM entries WHERE id = $1', [createdId]);
      assert.strictEqual(check.rowCount, 0, 'Rolled-back entry should not exist in database');
    }
  });

  // 2. Test Atomic Entry Creation with Sub-items
  await test('STAB-01: EntryModel.create creates entry and sub-items atomically', async () => {
    const entry = await EntryModel.create({
      title: 'Transaction Test Item',
      items: [
        { title: 'Subitem A', amount: 100, quantity: 2, is_completed: false },
        { title: 'Subitem B', amount: 50, quantity: 1, is_completed: true },
      ],
    });

    assert.ok(entry, 'Entry should be created');
    assert.strictEqual(entry.title, 'Transaction Test Item');
    assert.strictEqual(entry.items.length, 2, 'Entry should have 2 sub-items');
    assert.strictEqual(Number(entry.amount), 150, 'Entry total amount should equal sub-items sum');

    // Clean up
    await EntryModel.delete(entry.id);
  });

  // 3. Test PIN Settings & Bcrypt Hashing
  await test('STAB-02: SettingModel safely stores and retrieves bcrypt hashed PIN', async () => {
    const testPin = '9999';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPin, salt);

    await SettingModel.set('pin_hash', hash);
    const savedHash = await SettingModel.get('pin_hash');

    assert.ok(savedHash, 'PIN hash should be saved in app_settings');
    const isCorrect = await bcrypt.compare('9999', savedHash);
    const isWrong = await bcrypt.compare('0000', savedHash);

    assert.strictEqual(isCorrect, true, 'Correct PIN should match bcrypt hash');
    assert.strictEqual(isWrong, false, 'Incorrect PIN should fail bcrypt match');

    // Clean up
    await SettingModel.delete('pin_hash');
    const cleanCheck = await SettingModel.get('pin_hash');
    assert.strictEqual(cleanCheck, null, 'Deleted PIN should return null');
  });

  // 4. Test Calendar View Date Filter
  await test('STAB-05: EntryModel.findAll with calendar_mode filters within month range', async () => {
    const res = await EntryModel.findAll({
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      calendar_mode: true,
      limit: 500,
    });

    assert.ok(Array.isArray(res.entries), 'findAll should return array of entries');
    assert.ok(typeof res.meta.total === 'number', 'findAll should return total count in meta');
  });

  // 5. Test Full Import & Restore Engine (FEAT-B1)
  await test('FEAT-B1: EntryModel.importEntries imports entries with items atomically', async () => {
    const backupData = [
      {
        title: 'Import Test Task 1',
        category_name: 'นำเข้าทดสอบ',
        status: 'pending',
        priority: 'high',
        amount: 350,
        items: [
          { title: 'Item 1', amount: 150, quantity: 1, is_completed: false },
          { title: 'Item 2', amount: 200, quantity: 1, is_completed: true },
        ],
      },
    ];

    const result = await EntryModel.importEntries(backupData, { strategy: 'append' });
    assert.strictEqual(result.importedCount, 1, 'Should import 1 entry');

    // Find and verify
    const found = await EntryModel.findAll({ search: 'Import Test Task 1' });
    assert.ok(found.entries.length >= 1, 'Imported entry should be found');
    assert.strictEqual(found.entries[0].title, 'Import Test Task 1');

    // Clean up
    await EntryModel.delete(found.entries[0].id);
  });

  // 6. Test Category Monthly Budget (FEAT-C1)
  await test('FEAT-C1: CategoryModel supports monthly_budget and tracks current_month_spent', async () => {
    const testCategory = await CategoryModel.create({
      name: 'Budget Test Category',
      monthly_budget: 5000,
      color: '#F59E0B',
      icon: 'coins',
    });

    assert.ok(testCategory, 'Category should be created');
    assert.strictEqual(Number(testCategory.monthly_budget), 5000);

    const categories = await CategoryModel.findAll();
    const found = categories.find((c) => c.id === testCategory.id);
    assert.ok(found, 'Category should be in findAll list');
    assert.strictEqual(typeof found.current_month_spent, 'number');

    // Clean up
    await CategoryModel.delete(testCategory.id);
  });

  // 7. Test Habit Tracker & Streaks (FEAT-A3)
  await test('FEAT-A3: HabitModel creates habit and toggles daily completion with matrix', async () => {
    const habit = await HabitModel.create({
      name: 'Habit Test Run',
      icon: 'droplet',
      color: '#06B6D4',
      target_days: 7,
    });

    assert.ok(habit, 'Habit should be created');
    assert.strictEqual(habit.name, 'Habit Test Run');

    // Toggle today's completion
    const toggleRes = await HabitModel.toggleLog(habit.id);
    assert.strictEqual(toggleRes.is_completed, true, 'Log should be toggled to completed');

    const habits = await HabitModel.findAll();
    const found = habits.find((h) => h.id === habit.id);
    assert.ok(found, 'Habit should appear in findAll');
    assert.strictEqual(found.completedToday, true, 'completedToday should be true');
    assert.strictEqual(found.currentStreak >= 1, true, 'currentStreak should be at least 1');
    assert.strictEqual(found.weeklyMatrix.length, 7, 'weeklyMatrix should have 7 days');

    // Toggle again to uncheck
    const toggleAgain = await HabitModel.toggleLog(habit.id);
    assert.strictEqual(toggleAgain.is_completed, false, 'Log should be toggled to uncompleted');

    // Clean up
    await HabitModel.delete(habit.id);
  });

  // 8. Test FEAT-A4 GoalModel CRUD, entry link & progress calculations
  await test('FEAT-A4: GoalModel calculates task/amount progress and links with entries', async () => {
    // 1. Create a goal
    const goal = await GoalModel.create({
      title: 'Test Goal FEAT-A4',
      description: 'Goal for testing progress calculation',
      target_date: '2026-12-31',
      target_amount: 10000,
      color: '#10B981',
      icon: 'flag',
    });
    assert.ok(goal.id, 'Goal should be created with an ID');
    assert.strictEqual(goal.target_amount, 10000, 'Target amount should be 10000');

    // 2. Create entries linked to this goal
    const entry1 = await EntryModel.create({
      title: 'Goal Linked Entry 1',
      goal_id: goal.id,
      amount: 2500,
      status: 'completed',
    });
    const entry2 = await EntryModel.create({
      title: 'Goal Linked Entry 2',
      goal_id: goal.id,
      amount: 2500,
      status: 'pending',
    });

    assert.strictEqual(entry1.goal_id, goal.id, 'Entry1 should be linked to goal');
    assert.strictEqual(entry1.goal_title, 'Test Goal FEAT-A4', 'Entry1 should return goal title');

    // 3. Re-fetch goal to verify aggregated calculations
    const updatedGoal = await GoalModel.findById(goal.id);
    assert.strictEqual(updatedGoal.total_tasks, 2, 'Total tasks should be 2');
    assert.strictEqual(updatedGoal.completed_tasks, 1, 'Completed tasks should be 1');
    assert.strictEqual(updatedGoal.current_amount, 5000, 'Current amount should sum to 5000');
    assert.strictEqual(updatedGoal.task_progress, 50, 'Task progress should be 50%');
    assert.strictEqual(updatedGoal.amount_progress, 50, 'Amount progress should be 50% (5000/10000)');
    assert.strictEqual(updatedGoal.overall_progress, 50, 'Overall progress should track amount progress');

    // 4. Test getGoalEntries
    const goalEntries = await GoalModel.getGoalEntries(goal.id);
    assert.strictEqual(goalEntries.length, 2, 'Should return 2 linked entries');

    // 5. Clean up
    await EntryModel.delete(entry1.id);
    await EntryModel.delete(entry2.id);
    await GoalModel.delete(goal.id);
  });

  // 9. Test FEAT-C2 DashboardService.getMonthlyReport
  await test('FEAT-C2: DashboardService.getMonthlyReport returns tasks, financials and habit metrics', async () => {
    const report = await DashboardService.getMonthlyReport({ year: 2026, month: 10 });
    assert.ok(report.period, 'Report must have period object');
    assert.strictEqual(report.period.year, 2026, 'Year must match');
    assert.strictEqual(report.period.month, 10, 'Month must match');
    assert.ok(report.tasks, 'Report must have tasks metrics');
    assert.ok(typeof report.tasks.completionRate === 'number', 'completionRate must be a number');
    assert.ok(report.financials, 'Report must have financials metrics');
    assert.ok(Array.isArray(report.financials.categories), 'financials.categories must be array');
    assert.ok(report.habits, 'Report must have habits metrics');
    assert.ok(Array.isArray(report.goals), 'goals must be array');
    assert.ok(Array.isArray(report.accomplishments), 'accomplishments must be array');
  });

  // 10. Test FEAT-B2 AttachmentModel CRUD & Entry linking
  await test('FEAT-B2: AttachmentModel uploads, links to entry, and cleans up on disk', async () => {
    // Create entry
    const entry = await EntryModel.create({
      title: 'Attachment Test Entry',
      amount: 150,
    });

    // Create a dummy file in uploads
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const dummyPath = path.join(uploadsDir, `test-slip-${Date.now()}.png`);
    fs.writeFileSync(dummyPath, 'dummy-image-content');

    // Create attachment record
    const att = await AttachmentModel.create({
      entry_id: entry.id,
      file_name: 'test-slip.png',
      file_path: dummyPath,
      file_size: 19,
      mime_type: 'image/png',
    });

    assert.ok(att.id, 'Attachment should have ID');
    assert.strictEqual(att.entry_id, entry.id, 'Attachment entry_id should match');
    assert.ok(att.url.startsWith('/uploads/'), 'Attachment should have /uploads/ URL');

    // Verify findById on entry includes attachments
    const fetchedEntry = await EntryModel.findById(entry.id);
    assert.ok(Array.isArray(fetchedEntry.attachments), 'Entry should have attachments array');
    assert.strictEqual(fetchedEntry.attachments.length, 1, 'Entry should have 1 attachment');
    assert.strictEqual(fetchedEntry.attachments[0].file_name, 'test-slip.png');

    // Delete attachment
    const deleted = await AttachmentModel.delete(att.id);
    assert.strictEqual(deleted, true, 'Attachment should be deleted');
    assert.strictEqual(fs.existsSync(dummyPath), false, 'Disk file should be unlinked');

    // Cleanup entry
    await EntryModel.delete(entry.id);
  });

  // 11. Test FEAT-D2 PushModel and NotificationService
  await test('FEAT-D2: PushModel saves/deletes subscription & NotificationService checks due entries', async () => {
    const testEndpoint = `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`;
    const sub = await PushModel.saveSubscription({
      endpoint: testEndpoint,
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-secret',
    });

    assert.ok(sub.id, 'Subscription should be created');
    assert.strictEqual(sub.endpoint, testEndpoint, 'Endpoint should match');

    const allSubs = await PushModel.getAllSubscriptions();
    const found = allSubs.find((s) => s.endpoint === testEndpoint);
    assert.ok(found, 'Subscription should be in all list');

    // Test checkDueAndNotify
    const checkRes = await NotificationService.checkDueAndNotify();
    assert.ok(checkRes !== undefined, 'Check due should return result');

    // Delete subscription
    const deleted = await PushModel.deleteSubscription(testEndpoint);
    assert.strictEqual(deleted, true, 'Subscription should be deleted');
  });

  // 12. Test FEAT-E2 TemplateModel (Built-in seeding, Custom creation, Applying template)
  await test('FEAT-E2: TemplateModel retrieves built-in templates and applies them to entries', async () => {
    const templates = await TemplateModel.findAll();
    assert.ok(templates.length >= 6, 'Should have at least 6 templates');
    const beachTrip = templates.find((t) => t.title.includes('เที่ยวทะเล'));
    assert.ok(beachTrip, 'Should find Beach Trip template');
    assert.strictEqual(beachTrip.is_builtin, true, 'Beach Trip should be built-in');
    assert.ok(beachTrip.items.length >= 5, 'Should have checklist items');

    // Apply template to create new live entry
    const createdEntry = await TemplateModel.apply(beachTrip.id);
    assert.ok(createdEntry.id, 'Entry should be created from template');
    assert.strictEqual(createdEntry.title, beachTrip.title);
    assert.ok(createdEntry.items.length >= 5, 'Created entry should have checklist items');

    // Create custom user template
    const custom = await TemplateModel.create({
      title: 'Custom Testing Template',
      description: 'Template created for testing',
      items: [{ title: 'Custom Item 1', amount: 50 }],
    });
    assert.ok(custom.id, 'Custom template should be created');
    assert.strictEqual(custom.is_builtin, false, 'Custom template should not be built-in');

    // Delete custom template
    const deletedCustom = await TemplateModel.delete(custom.id);
    assert.strictEqual(deletedCustom, true, 'Custom template should be deleted');

    // Cleanup applied entry
    await EntryModel.delete(createdEntry.id);
  });

  // 13. Test FEAT-B4 Category custom_schema & Entry custom_values
  await test('FEAT-B4: CategoryModel custom_schema and EntryModel custom_values persist correctly', async () => {
    // Create category with custom schema
    const customFields = [
      { id: 'mileage', name: 'เลขไมล์', type: 'number', required: true },
      { id: 'service_center', name: 'ศูนย์บริการ', type: 'text', required: false },
    ];
    const category = await CategoryModel.create({
      name: 'ยานพาหนะทดสอบ',
      icon: 'zap',
      color: '#8B5CF6',
      custom_schema: customFields,
    });
    assert.ok(category.id, 'Category should be created');
    assert.deepStrictEqual(category.custom_schema, customFields, 'Category should retain custom_schema');

    // Create entry with custom values
    const entry = await EntryModel.create({
      category_id: category.id,
      title: 'ถ่ายน้ำมันเครื่องรถยนต์',
      amount: 1500,
      custom_values: { mileage: 45000, service_center: 'โตโยต้า เจริญนคร' },
    });
    assert.ok(entry.id, 'Entry should be created with custom_values');
    assert.strictEqual(entry.custom_values.mileage, 45000, 'Mileage should match');
    assert.strictEqual(entry.custom_values.service_center, 'โตโยต้า เจริญนคร', 'Service center should match');

    // Update entry custom values
    const updated = await EntryModel.update(entry.id, {
      custom_values: { mileage: 45500, service_center: 'โตโยต้า ชลบุรี' },
    });
    assert.strictEqual(updated.custom_values.mileage, 45500, 'Updated mileage should match');

    // Cleanup
    await EntryModel.delete(entry.id);
    await CategoryModel.delete(category.id);
  });

  // 14. Test FEAT-E1 DashboardService getLayout & updateLayout
  await test('FEAT-E1: DashboardService retrieves and updates modular layout', async () => {
    const layout = await DashboardService.getLayout();
    assert.ok(Array.isArray(layout), 'Layout should be an array');
    assert.ok(layout.length >= 6, 'Layout should have default 6 widgets');

    // Reorder layout
    const modifiedLayout = [...layout];
    const first = modifiedLayout[0];
    modifiedLayout[0] = modifiedLayout[1];
    modifiedLayout[1] = first;
    modifiedLayout[0].order = 1;
    modifiedLayout[1].order = 2;

    const saved = await DashboardService.updateLayout(modifiedLayout);
    assert.strictEqual(saved[0].id, modifiedLayout[0].id, 'Saved layout first item should match updated layout');

    // Restore original order
    await DashboardService.updateLayout(layout);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
