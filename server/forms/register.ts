import express from "express";
import multer from "multer";
import { existsSync, renameSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { createSimpleId } from "../utils/createId";
import { mkDirRecursive } from "../utils/mkDir";
import { getProjectFormUploadDir, getUploadDir } from "../utils/uploadDir";
import { FormAttachment, FormSubmission } from "./convertRows";
import { saveFormSubmission } from "./saveFormSubmission";
import { scheduleFormSubmissionEmail } from "./sendEmail/queue";
import { getFormSettings } from "./settings/getFormSettings";
import { FormValidationError, validateFormData } from "./validateFormData";

// Get the upload directory
const saveDir = getUploadDir("temp", "forms");

const upload = multer({ dest: saveDir });

// setup a api endpoint for assets
export const router = express.Router();

router.get("/forms/submit/:projectId/:projectEnv", async (req, res) => {
  res.send("Form submission endpoint");
});

// ! This endpoint handles form submissions from untrusted sources
router.post(
  "/forms/submit/:projectId/:projectEnv",
  upload.array("attachments", 5),
  async (req, res) => {
    // based on that no public endpoint can't access /forms/submit
    // this has to go though a proxy server

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

    const settings = await getFormSettings(projectId, projectEnv, formName);
    if (!settings || !settings.enabled) {
      const error: FormValidationError = {
        message: "Form is currently not accepting submissions.",
        name: "",
      };

      res.status(400).json({ errors: [error], success: false });
      return;
    }

    if (errors) {
      res.status(400).json({ errors, success: false });
      return;
    }

    /**
     * The list of uploaded files
     */
    const attachments: Omit<
      FormAttachment,
      "submissionId" | "createdAt" | "updatedAt"
    >[] = [];

    // get the save directory for attachments
    const subDir = await createSimpleId("submission");
    const uploadDir = join(getProjectFormUploadDir(projectId), subDir);

    if (files.length > 0) {
      await mkDirRecursive(uploadDir);
    }

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
        fileName: join(subDir, newFileName),
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
      siteEnv: projectEnv,
      formName: formName,
      ipAddress: req.ip || "",
      userAgent: req.headers["user-agent"] || "",
      contents: formData,
      sentEmailId: "",
      attachments: attachments as FormAttachment[],
    };

    // save the form submission to the database
    const { submissionId } = await saveFormSubmission(projectId, submission);
    console.log(
      "Submission ID:",
      submissionId,
      "Form Name:",
      formName,
      "Project ID:",
      projectId
    );

    // schedule the email sending
    await scheduleFormSubmissionEmail(submissionId);

    if (redirect) {
      res.redirect(redirect);
    } else {
      res.json({ message: "Form submission successful!", success: true });
    }
  }
);
