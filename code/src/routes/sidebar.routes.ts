import express from "express";
import editBlobObject from "../controllers/sidebar/editBlobObject";
import getFolderStructureTree from "../controllers/sidebar/getFolderStructure-tree";
import getFolderStructureList from "../controllers/sidebar/getFolderStructure-list";
import addBlobObject from "../controllers/sidebar/addBlobObject";
import deleteBlobObject from "../controllers/sidebar/deleteBlobObject";
import { authenticate } from "../middelware/auth.middleware";

const router = express.Router();

router.get("/get-folder-structure/tree", authenticate, getFolderStructureTree);
router.get("/get-folder-structure/list", authenticate, getFolderStructureList);

// Keep the same API endpoints for backward compatibility with frontend
router.post("/add-s3-object", authenticate, addBlobObject);

router.put("/edit-s3-object", authenticate, editBlobObject);

router.put("/delete-s3-object", authenticate, deleteBlobObject);

export default router;
