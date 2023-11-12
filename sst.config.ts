import { SSTConfig } from "sst";
import { Config, NextjsSite } from "sst/constructs";

const CUSTOM_DOMAINS: Record<string, any> = {
  preview: { domainName: "preview.ruchern.xyz", hostedZone: "ruchern.xyz" },
  prod: "ruchern.xyz",
};

export default {
  config(_input) {
    return {
      name: "portfolio",
      region: "ap-southeast-1",
    };
  },
  stacks(app) {
    app.stack(function site({ stack }) {
      const DATABASE_URL = new Config.Secret(stack, "DATABASE_URL");

      const nextjsSite = new NextjsSite(stack, "site", {
        bind: [DATABASE_URL],
        customDomain: CUSTOM_DOMAINS[stack.stage],
      });

      stack.addOutputs({
        SiteUrl: nextjsSite.url,
      });
    });
  },
} satisfies SSTConfig;
