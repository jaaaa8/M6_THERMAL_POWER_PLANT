const searchableEmployeeText = (employee) => [
  employee.fullName,
  employee.employeeCode,
  employee.department?.name,
  employee.position?.name,
].filter(Boolean).join(' ').toLocaleLowerCase('vi');

export const searchWorkOrderRoles = async (
  employees,
  { query = '', page = 0, size = 10 },
  filterClient,
) => {
  const keyword = query.trim().toLocaleLowerCase('vi');
  let matches = keyword
    ? employees.filter((employee) => searchableEmployeeText(employee).includes(keyword))
    : employees;

  if (filterClient) matches = filterClient(matches);

  const start = page * size;
  return {
    data: {
      content: matches.slice(start, start + size),
      totalElements: matches.length,
      totalPages: Math.max(1, Math.ceil(matches.length / size)),
    },
  };
};

export const searchWorkOrderMembers = (employees, params, excludedIds) => {
  const excluded = new Set([...excludedIds].map(String));
  return searchWorkOrderRoles(
    employees,
    params,
    (matches) => matches.filter((employee) => !excluded.has(String(employee.id))),
  );
};
