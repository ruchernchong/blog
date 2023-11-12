import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "portfolio",
      region: "ap-southeast-1",
    };
  },
  stacks(app) {
    app.stack(function site({ stack }) {
      const site = new NextjsSite(stack, "site", {
        customDomain: "ruchern.xyz",
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
