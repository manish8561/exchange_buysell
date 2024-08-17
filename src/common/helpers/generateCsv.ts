import { createObjectCsvWriter } from "csv-writer";
import * as fs from "fs";
const createCSVFile = async (records: any, columns: any): Promise<any> => {
  try {
    // Create a CSV writer object
    const csvWriter = createObjectCsvWriter({
      path: "temp.csv", // This won't actually save the file on the server
      header: columns,
    });

    // Write records to the CSV file
    const aa = await csvWriter.writeRecords(records);

    // Read the CSV file data
    const file = "temp.csv";
    const fileData: any = await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file);
      let data = "";

      stream.on("data", (chunk) => {
        data += chunk;
      });

      stream.on("end", () => {
        resolve(data);
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });

    // Generate a unique filename based on the current timestamp
    const fileExt = file.split(".").pop();
    const fileName = `csv_${new Date().valueOf()}.${fileExt}`;

    // Send the CSV file information to the frontend for download
    return { fileName, fileData };
  } catch (error: any) {
    console.error("Error creating CSV file:", error);
    return false;
  }
};
export default createCSVFile;
