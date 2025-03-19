import { readFileSync } from "fs";

// Read the file and print its contents.
const ascii = readFileSync("./templates/logo.txt", "utf8");
console.log(ascii);
