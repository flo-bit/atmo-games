import { defineLexiconConfig } from "@atcute/lex-cli";

export default defineLexiconConfig({
  outdir: "src/lexicon-types/",
  files: ["lexicons/**/*.json"],
  imports: ["@atcute/atproto"],
  pull: {
    outdir: "lexicons/",
    sources: [
      {
        type: "git",
        remote: "https://github.com/flo-bit/contrail-games.git",
        pattern: ["lexicons-generated/**/*.json", "lexicons-pulled/**/*.json", "lexicons/**/*.json"],
      },
    ],
  },
});
