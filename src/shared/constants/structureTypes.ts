/**
 * Константы для типов структур с поддержкой локализации
 */

// Ключи для локализации типов структур
export const STRUCTURE_TYPE_KEYS = {
  DEPARTMENT: 'structures.types.department',
  TEAM: 'structures.types.team',
} as const;

// Значения типов структур (используются для сравнения с данными с сервера)
export const STRUCTURE_TYPE_VALUES = {
  DEPARTMENT: 'Департамент',
  TEAM: 'Отдел',
} as const;

// Английские значения для сравнения
export const STRUCTURE_TYPE_VALUES_EN = {
  DEPARTMENT: 'Department',
  TEAM: 'Team',
} as const;

/**
 * Проверяет, является ли тип структуры департаментом
 */
export const isDepartmentType = (type: { name?: string; value?: string } | null | undefined): boolean => {
  if (!type) return false;
  return (
    type.name === STRUCTURE_TYPE_VALUES.DEPARTMENT || 
    type.value === STRUCTURE_TYPE_VALUES.DEPARTMENT ||
    type.name === STRUCTURE_TYPE_VALUES_EN.DEPARTMENT || 
    type.value === STRUCTURE_TYPE_VALUES_EN.DEPARTMENT
  );
};

/**
 * Проверяет, является ли тип структуры отделом
 */
export const isTeamType = (type: { name?: string; value?: string } | null | undefined): boolean => {
  if (!type) return false;
  return (
    type.name === STRUCTURE_TYPE_VALUES.TEAM || 
    type.value === STRUCTURE_TYPE_VALUES.TEAM ||
    type.name === STRUCTURE_TYPE_VALUES_EN.TEAM || 
    type.value === STRUCTURE_TYPE_VALUES_EN.TEAM
  );
};

/**
 * Получает локализованное название типа структуры
 */
export const getStructureTypeLabel = (
  type: { name?: string; value?: string } | null | undefined,
  t: (key: string) => string
): string => {
  if (!type) return '';
  
  if (isDepartmentType(type)) {
    return t(STRUCTURE_TYPE_KEYS.DEPARTMENT);
  }
  
  if (isTeamType(type)) {
    return t(STRUCTURE_TYPE_KEYS.TEAM);
  }
  
  // Fallback к оригинальному названию
  return type.name || type.value || '';
};
