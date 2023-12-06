import path from 'path';
import cds from '@sap/cds';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const connectTest = (dirName: string) => {
  const project = path.join(dirName, '..', 'bookshop');
  return cds.test(project);
};
