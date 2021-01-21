// @ts-ignore
import { findFiles } from "@brillout/project-files";

export { findAndLoadTelefuncFiles };

async function findAndLoadTelefuncFiles() {
  await Promise.resolve();
  [...findFiles("*.endpoints.js"), ...findFiles("endpoints.js")].forEach(
    (endpointFile) => {
      require(endpointFile);
    }
  );
}
