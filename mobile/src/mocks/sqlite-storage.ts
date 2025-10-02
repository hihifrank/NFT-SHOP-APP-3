// Mock implementation for react-native-sqlite-storage

interface SQLiteDatabase {
  executeSql: (
    sql: string,
    params?: any[],
    success?: (result: any) => void,
    error?: (error: any) => void
  ) => void;
}

interface SQLiteResult {
  rows: {
    length: number;
    item: (index: number) => any;
  };
}

class MockSQLiteDatabase implements SQLiteDatabase {
  private mockData: { [key: string]: any[] } = {};

  executeSql(
    sql: string,
    params: any[] = [],
    success?: (result: any) => void,
    error?: (error: any) => void
  ): void {
    setTimeout(() => {
      try {
        console.log(`Mock SQL: ${sql}`, params);
        
        // Mock successful execution
        const result: SQLiteResult = {
          rows: {
            length: 0,
            item: (index: number) => ({}),
          },
        };
        
        success?.(result);
      } catch (err) {
        error?.(err);
      }
    }, 100);
  }
}

const openDatabase = (
  config: { name: string; location: string },
  success?: () => void,
  error?: (error: any) => void
): SQLiteDatabase => {
  setTimeout(() => {
    success?.();
  }, 100);
  
  return new MockSQLiteDatabase();
};

export default {
  openDatabase,
};