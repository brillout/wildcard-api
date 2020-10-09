// @ts-ignore
import { findFiles } from "@brillout/project-files";

export { autoLoadEndpointFiles };

function autoLoadEndpointFiles() {
  [...findFiles("*.endpoints.js"), ...findFiles("endpoints.js")].forEach(
    (endpointFile) => {
      require(endpointFile);
    }
  );
}
