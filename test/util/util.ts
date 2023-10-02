import path from 'path';
import cds from '@sap/cds';

export const connectTest = (dirName: string, projectName: string) => {
  const project = path.join(dirName, '..', projectName);
  cds.test(project);

  return cds;
};

export const getBooksEntity = async (_cds: ReturnType<typeof connectTest>) => {
  const CatalogService = await _cds.connect.to('CatalogService');
  const { Books } = CatalogService.entities;

  return Books;
};
