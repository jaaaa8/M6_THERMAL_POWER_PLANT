import test from 'node:test';
import assert from 'node:assert/strict';
import { searchWorkOrderMembers } from './workOrderRoleSearch.js';

test('filters unavailable work-order members before pagination', async () => {
  const employees = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    employeeCode: `NV${String(index + 1).padStart(3, '0')}`,
    fullName: `Nhân viên ${index + 1}`,
    department: { name: 'Sửa chữa' },
    position: { name: 'Kỹ sư' },
  }));

  const result = await searchWorkOrderMembers(
    employees,
    { query: '', page: 0, size: 1 },
    new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  );

  assert.deepEqual(result.data.content.map((employee) => employee.id), [11]);
  assert.equal(result.data.totalElements, 2);
  assert.equal(result.data.totalPages, 2);
});
