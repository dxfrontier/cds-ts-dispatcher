import path from 'path';
import cds from '@sap/cds';

export const connectTest = (dirName: string) => {
  const project = path.join(dirName, '..', 'bookshop');
  return cds.test(project);
};
