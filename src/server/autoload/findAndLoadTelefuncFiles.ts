// @ts-ignore
import { findFiles } from "@brillout/project-files";

export { findAndLoadTelefuncFiles };

function findAndLoadTelefuncFiles() {
  [...findFiles("*.endpoints.js"), ...findFiles("endpoints.js")].forEach(
    (endpointFile) => {
      require(endpointFile);
    }
  );
}
