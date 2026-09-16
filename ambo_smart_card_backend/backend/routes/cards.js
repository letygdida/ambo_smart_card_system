const express = require("express");
const db = require("../db");

const router = express.Router();



// GET ALL CARDS

router.get("/", (req,res)=>{


    const sql = `

    SELECT 

    cards.*,
    students.name

    FROM cards

    LEFT JOIN students

    ON cards.student_id = students.student_id

    ORDER BY cards.id DESC

    `;


    db.query(sql,(err,result)=>{


        if(err){

            return res.status(500).json({

                error:err

            });

        }


        res.json(result);


    });


});







// GENERATE CARD FOR STUDENT

router.post("/generate/:student_id",(req,res)=>{

    const student_id = decodeURIComponent(req.params.student_id);
    
    console.log(`🎓 Card generation request for student: ${student_id}`);

    // Check student exists
    const studentSQL = "SELECT * FROM students WHERE student_id=?";

    db.query(studentSQL,[student_id],(err,studentResult)=>{

        if(err){
            console.error("❌ Error checking student:", err);
            return res.status(500).json({
                error:err.message
            });
        }

        if(studentResult.length === 0){
            console.log("❌ Student not found");
            return res.status(404).json({
                message:"Student not found in database"
            });
        }

        const student = studentResult[0];
        console.log(`✓ Student found: ${student.username}`);

        // Check if student already has a smart card ID
        if(student.smart_card_id && student.smart_card_id !== ''){
            console.log(`⚠️ Student already has Smart ID: ${student.smart_card_id}`);
            return res.status(409).json({
                message:"Smart ID already generated for this student",
                alreadyExists: true,
                existingCardId: student.smart_card_id,
                student: student
            });
        }

        // Check if card exists in cards table
        const checkSQL = "SELECT * FROM cards WHERE student_id=?";

        db.query(checkSQL,[student_id],(err,result)=>{

            if(err){
                console.error("❌ Error checking cards:", err);
                return res.status(500).json({
                    error:err.message
                });
            }

            if(result.length > 0){
                console.log(`⚠️ Card already exists in cards table: ${result[0].card_id}`);
                return res.status(409).json({
                    message:"Smart ID already generated for this student",
                    alreadyExists: true,
                    existingCardId: result[0].card_id,
                    student: student
                });
            }

            console.log("✓ No existing card found, proceeding with generation...");

            // Generate card number
            const year = new Date().getFullYear();
            const number = Math.floor(1000 + Math.random() * 9000);
            const card_id = `CARD-${year}-${number}`;
            
            console.log(`🆔 Generated new card ID: ${card_id}`);

            const insertSQL = `
            INSERT INTO cards
            (card_id,status,issue_date,student_id)
            VALUES(?,?,CURDATE(),?)
            `;

            db.query(
                insertSQL,
                [card_id, "active", student_id],
                (err,result)=>{

                    if(err){

                        if(err.code === "ER_DUP_ENTRY"){
                            console.error("❌ Duplicate card entry");
                            return res.status(400).json({
                                message:"Card ID already exists, please try again"
                            });
                        }

                        console.error("❌ Error inserting card:", err);
                        return res.status(500).json({
                            error:err.message
                        });
                    }

                    console.log("✅ Card inserted into cards table");

                    // Update student table
                    const updateSQL = "UPDATE students SET smart_card_id=? WHERE student_id=?";

                    db.query(
                        updateSQL,
                        [card_id, student_id],
                        (err) => {
                            if(err){
                                console.error("⚠️ Error updating student table:", err);
                            } else {
                                console.log("✅ Student table updated with card ID");
                            }
                        }
                    );

                    console.log(`🎉 Smart ID generated successfully for ${student_id}`);
                    
                    res.json({
                        message:"Smart ID generated successfully",
                        card_id:card_id,
                        generated: true
                    });
                }
            );
        });
    });
});











// BLOCK CARD

router.put("/block/:card_id",(req,res)=>{


    const card_id=req.params.card_id;



    const sql=

    "UPDATE cards SET status='blocked' WHERE card_id=?";



    db.query(sql,[card_id],(err,result)=>{


        if(err){

            return res.status(500).json({

                error:err

            });

        }



        res.json({

            message:"Card blocked successfully"

        });



    });



});







module.exports = router;