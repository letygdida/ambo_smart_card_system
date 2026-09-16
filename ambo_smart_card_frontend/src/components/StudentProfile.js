import { API_URL } from '../config';

import SmartCard from "./SmartCard";
import {useEffect,useState} from "react";

import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button
} from "@mui/material";



function StudentProfile({student}){


    const [attendance,setAttendance] = useState([]);



    useEffect(()=>{


        fetch(
            `${API_URL}/api/students/${student.student_id}/attendance`
        )


        .then(res=>res.json())


        .then(data=>{


            if(Array.isArray(data)){

                setAttendance(data);

            }

            else{

                setAttendance([]);

            }


        })


        .catch(err=>{

            console.log(err);

        });



    },[student]);






    const printCard=()=>{

        window.print();

    };






return(


<div style={{padding:"20px"}}>




<Typography variant="h4">

Student Profile

</Typography>





<div

style={{

display:"flex",

gap:"40px",

flexWrap:"wrap",

marginTop:"20px"

}}

>



<div>


<SmartCard student={student}/>



<Button

variant="contained"

sx={{marginTop:"20px"}}

onClick={printCard}

>

Print Smart Card

</Button>


</div>








<div>


<Typography variant="h5">

Student Information

</Typography>




<p>

<b>Name:</b> {student.name}

</p>



<p>

<b>Student ID:</b> {student.student_id}

</p>




<p>

<b>Department:</b> {student.department}

</p>




<p>

<b>Year:</b> {student.year}

</p>




<p>

<b>Smart Card:</b>

{" "}

{student.smart_card_id || "Not Assigned"}

</p>



</div>



</div>









<Typography

variant="h5"

sx={{marginTop:"40px"}}

>

Attendance History

</Typography>







<TableContainer

component={Paper}

sx={{marginTop:"20px"}}

>


<Table>



<TableHead>


<TableRow>


<TableCell>

ID

</TableCell>


<TableCell>

Card ID

</TableCell>


<TableCell>

Date

</TableCell>


<TableCell>

Time

</TableCell>


</TableRow>


</TableHead>






<TableBody>



{

attendance.map((item)=>(


<TableRow key={item.id}>


<TableCell>

{item.id}

</TableCell>


<TableCell>

{item.card_id}

</TableCell>


<TableCell>

{item.date}

</TableCell>


<TableCell>

{item.time}

</TableCell>



</TableRow>


))


}






{

attendance.length===0 &&


<TableRow>


<TableCell colSpan="4">


No attendance records found


</TableCell>


</TableRow>


}




</TableBody>



</Table>


</TableContainer>






</div>


);


}



export default StudentProfile;