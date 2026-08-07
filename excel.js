/* excel.js */
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('loadingOverlay').classList.add('show');

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            let allExtractedStaff = [];
            let rowCounter = 1;

            workbook.SheetNames.forEach((sheetName) => {
                const ws = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                if (!rows || rows.length === 0) return;

                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(rows.length, 5); i++) {
                    const rowStr = rows[i].map(cell => String(cell).toUpperCase()).join(" ");
                    if (rowStr.includes("EMP") || rowStr.includes("NAME") || rowStr.includes("OFFICIAL") || rowStr.includes("CONTACT")) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) headerRowIndex = 0;

                const headers = rows[headerRowIndex].map(h => String(h).trim().toUpperCase());
                
                const getColIndex = (keywords) => {
                    return headers.findIndex(h => keywords.some(k => h.includes(k)));
                };

                const idxName = getColIndex(["NAME", "OFFICIAL", "EMPLOYEE", "PERSON"]);
                const idxEmp = getColIndex(["EMP", "CODE", "EMP.CODE", "EMP CODE", "EMPID"]);
                const idxDesig = getColIndex(["DESIGNATION", "DEPARTMENT", "DEPT", "POST"]);
                const idxMobile = getColIndex(["MOBILE", "CONTACT", "PHONE", "CELL"]);
                const idxEmail = getColIndex(["MAIL", "EMAIL", "E-MAIL"]);
                const idxAddress = getColIndex(["ADDRESS", "LOCATION", "CITY"]);

                for (let r = headerRowIndex + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    let name = idxName !== -1 ? String(row[idxName] || "").trim() : "";
                    let empCode = idxEmp !== -1 ? String(row[idxEmp] || "").trim() : "";
                    let designation = idxDesig !== -1 ? String(row[idxDesig] || "").trim() : "STAFF";
                    let mobile = idxMobile !== -1 ? String(row[idxMobile] || "").trim() : "";
                    let email = idxEmail !== -1 ? String(row[idxEmail] || "").trim() : "";
                    let address = idxAddress !== -1 ? String(row[idxAddress] || "").trim() : "";

                    if (name && !name.toUpperCase().includes("STATE/") && !name.toUpperCase().includes("BRANCH") && !name.toUpperCase().includes("TOTAL")) {
                        // ⚠️⚠️⚠️ YE DEKHO: rawempcode (sab small) aur empid (sab small) use kiya hai ⚠️⚠️⚠️
                        const staffRecord = {
                            name: name,
                            rawempcode: empCode || `TEMP-${rowCounter++}`, 
                            empid: empCode || `TEMP-${rowCounter}`, // Database mein empid hai
                            designation: designation || "STAFF",
                            company: sheetName,
                            location: sheetName,
                            mobile: mobile || "N/A",
                            email: email || "N/A",
                            address: address || "N/A"
                        };
                        
                        allExtractedStaff.push(staffRecord);
                    }
                }
            });

            if (allExtractedStaff.length === 0) {
                alert("❌ Excel file se koi valid data nahi mila!");
                document.getElementById('loadingOverlay').classList.remove('show');
                return;
            }

            console.log("Total records to insert:", allExtractedStaff.length);
            console.log("Sample record:", allExtractedStaff[0]);

            const chunkSize = 100;
            let successCount = 0;

            for (let i = 0; i < allExtractedStaff.length; i += chunkSize) {
                const chunk = allExtractedStaff.slice(i, i + chunkSize);
                const { data: insertedData, error } = await supabaseClient
                    .from('staff')
                    .insert(chunk)
                    .select();

                if (error) {
                    console.error("Insert Error:", error);
                    throw error;
                }
                successCount += chunk.length;
            }

            alert(`✅ Success! Total ${successCount} records upload ho gaye.`);
            if(typeof fetchStaffFromDatabase === 'function') fetchStaffFromDatabase();

        } catch (err) {
            console.error("Upload Error:", err);
            alert("❌ Error uploading file: " + err.message);
        } finally {
            event.target.value = "";
            document.getElementById('loadingOverlay').classList.remove('show');
        }
    };
    reader.readAsArrayBuffer(file);
}
