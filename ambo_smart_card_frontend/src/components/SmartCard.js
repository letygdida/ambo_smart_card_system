import { API_URL } from '../config';

import {
    Card,
    CardContent,
    Typography,
    Button,
    Avatar,
    Box
} from "@mui/material";

import { QRCodeCanvas } from "qrcode.react";


function SmartCard({student}){


return(


<div style={{padding:"20px"}}>


<Card

sx={{

width:"380px",

borderRadius:"15px",

boxShadow:5,

background:"#f5f9ff"

}}

>


<CardContent>



<Box
    component="img"
    src="/images/ambo-university-logo.png"
    alt="Ambo University"
    sx={{
        width: "100%",
        maxHeight: 70,
        objectFit: "contain",
        display: "block",
        mx: "auto",
        mb: 1
    }}
/>




<Typography

align="center"

color="gray"

>

SMART ID CARD

</Typography>




<div

style={{

display:"flex",

justifyContent:"center",

margin:"20px"

}}

>

{student.photo ? (
    <Avatar
        src={`${API_URL}/uploads/${student.photo}`}
        sx={{
            width: 80,
            height: 80,
            fontSize: "2rem"
        }}
    />
) : (
    <Avatar
        sx={{
            width: 80,
            height: 80,
            background: "#ddd",
            fontSize: "2rem"
        }}
    >
        No Photo
    </Avatar>
)}

</div>




<Typography>

<strong>Name:</strong> {student.name}

</Typography>



<Typography>

<strong>Student ID:</strong> {student.student_id}

</Typography>




<Typography>

<strong>Department:</strong> {student.department}

</Typography>




<Typography>

<strong>Year:</strong> {student.year}

</Typography>




<Typography

sx={{marginTop:"10px"}}

>

<strong>Card ID:</strong> {student.smart_card_id || "Not Assigned"}

</Typography>




<div

style={{

display:"flex",

justifyContent:"center",

marginTop:"20px"

}}

>


<QRCodeCanvas

value={

student.smart_card_id ||

student.student_id

}

/>

</div>




<Button

variant="contained"

sx={{marginTop:"20px",width:"100%"}}

onClick={()=>window.print()}

>

Print Card

</Button>




</CardContent>


</Card>



</div>


);


}



export default SmartCard;
