import fs from "fs";
import path from "path";
import YAML from "yaml";
import { Request, Response } from "express";
import { coreV1Api, k8sApi } from "../k8s-client";

const sanitize = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "");

export const handleSpawn = async (req: Request, res: Response) => {
  const { username: rawUsername } = req.body;

  if (!rawUsername) {
    res.status(400).json({ error: "username is required" });
    return;
  }

  const username = sanitize(rawUsername);
  const deploymentName = `user-${username}`;
  const serviceName = `${deploymentName}-svc`;

  const deploymentYamlPath = path.join(
    __dirname,
    "..",
    "k8s",
    "deployment.yaml"
  );
  const serviceYamlPath = path.join(__dirname, "..", "k8s", "service.yaml");

  try {
    // Load and template deployment YAML
    let deploymentFile = fs.readFileSync(deploymentYamlPath, "utf8");
    const populatedDeploymentYaml = deploymentFile
      .replace(/{{USERNAME}}/g, username)
      .replace(/{{BLOB_PATH}}/g, `users/${rawUsername}/VCode`)
      .replace(/{{AZURE_CONTAINER_NAME}}/g, process.env.AZURE_STORAGE_CONTAINER_NAME || "codex-bucket")
      .replace(/{{AZURE_STORAGE_CONNECTION_STRING}}/g, process.env.AZURE_STORAGE_CONNECTION_STRING || "");

    const deploymentManifest = YAML.parse(populatedDeploymentYaml);

    // Load and template service YAML
    let serviceFile = fs.readFileSync(serviceYamlPath, "utf8");
    const populatedServiceYaml = serviceFile.replace(/{{USERNAME}}/g, username);
    const serviceManifest = YAML.parse(populatedServiceYaml);

    // Create deployment
    const deployResponse = await k8sApi.createNamespacedDeployment({
      namespace: "default",
      body: deploymentManifest,
    });
    console.log(`✅ Deployment created: ${deploymentName}`);

    // Create service
    const serviceResponse = await coreV1Api.createNamespacedService({
      namespace: "default",
      body: serviceManifest,
    });
    console.log(`✅ Service created: ${serviceName}`);
    
    res.status(201).json({
      message: "Deployment and Service created 🎉",
      deployment: deployResponse,
      service: serviceResponse,
    });
  } catch (err: any) {
    // If deployment already exists, that's okay
    if (err.body?.reason === "AlreadyExists") {
      console.log(`ℹ️ Deployment ${deploymentName} already exists`);
      res.status(200).json({
        message: "Container already exists",
        serviceName: serviceName,
      });
      return;
    }
    console.error("❌ Error during spawn:", err);
    res.status(500).json({ error: "Failed to create deployment/service" });
  }
};
