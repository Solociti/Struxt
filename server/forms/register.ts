import express from "express";
import multer from "multer";
import { existsSync, renameSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { mkDirRecursive } from "../utils/mkDir";
import { getProjectFormUploadDir, getUploadDir } from "../utils/uploadDir";
import { FormAttachment, FormSubmission } from "./convertRows";
import { saveFormSubmission } from "./saveFormSubmission";
import { validateFormData } from "./validateFormData";

// Get the upload directory
const saveDir = getUploadDir("temp", "forms");

const upload = multer({ dest: saveDir });

// setup a api endpoint for assets
export const router = express.Router();

router.get("/", async (req, res) => {
  // Return the list of assets
  res.json([]);
});

// ! This endpoint handles form submissions from untrusted sources
router.post(
  "/forms/submit/:projectId/:projectEnv",
  upload.array("files", 5),
  async (req, res) => {
    // TODO: only allow from local proxies to prevent unauthorized uploads
    // TODO: rate limit the uploads

    const redirect = req.query.redirect as string | "";
    const projectId = req.params.projectId;
    const projectEnv = req.params.projectEnv as "staging" | "production";
    const files = Array.isArray((req as any).files) ? (req as any).files : [];

    if (!["staging", "production"].includes(projectEnv)) {
      res.status(400).send("Invalid environment");
      return;
    }

    // parse the form data
    const { formName, formData, errors } = await validateFormData(
      projectId,
      projectEnv,
      req.body
    );

    if (errors) {
      // TODO: setup the error page handler
      res.status(400).json({ errors });
      return;
    }

    /**
     * The list of uploaded files
     */
    const attachments: Omit<
      FormAttachment,
      "submissionId" | "createdAt" | "updatedAt"
    >[] = [];

    const uploadDir = getProjectFormUploadDir(projectId);
    await mkDirRecursive(uploadDir);

    for (const file of files) {
      const ext = extname(file.originalname);
      const originalName = basename(file.originalname, ext);

      let newFileName = originalName + ext;
      let count = 0;

      // check if the file already exists
      // if it does, add a number to the end of the file name
      while (existsSync(join(uploadDir, newFileName))) {
        count++;
        newFileName = `${originalName}-${count}${ext}`;
      }

      renameSync(file.path, join(uploadDir, newFileName));

      attachments.push({
        originalName: file.originalname,
        fileName: newFileName,
        avStatus: "pending",
        avResult: "",
      });
    }

    /**
     * Setup the form submission data
     */
    const submission: FormSubmission = {
      createdAt: new Date(),
      updatedAt: new Date(),
      siteId: projectId,
      formName: formName,
      ipAddress: req.ip || "",
      userAgent: req.headers["user-agent"] || "",
      contents: formData,
      sentEmailId: "",
      attachments: attachments as FormAttachment[],
    };

    // save the form submission to the database
    await saveFormSubmission(projectId, submission);
    // TODO: log the form submission
    // TODO: schedule the email sending

    if (redirect) {
      res.redirect(redirect);
    } else {
      res.send("Success!");
    }
  }
);
