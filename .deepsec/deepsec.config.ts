import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "blog", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
