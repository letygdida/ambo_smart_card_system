import { API_URL } from '../config';

import { useEffect, useState, useCallback } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    TextField
} from "@mui/material";


function Cards(){


    const [cards,setCards] = useState([]);

    const [search,setSearch] = useState("");


    const token = localStorage.getItem("token");





    const loadCards = useCallback(()=>{


        fetch(

            `${API_URL}/api/cards`,

            {

                headers:{

                    Authorization:"Bearer " + token

                }

            }

        )


        .then(res=>res.json())


        .then(data=>{


            if(Array.isArray(data)){

                setCards(data);

            }

            else{

                setCards([]);

            }


        })


        .catch(err=>{


            console.log(err);


            setCards([]);


        });



    },[token]);







    useEffect(()=>{


        loadCards();


    },[loadCards]);









    const blockCard=(card_id)=>{


        fetch(

            `${API_URL}/api/cards/block/${card_id}`,

            {

                method:"PUT",

                headers:{

                    Authorization:"Bearer " + token

                }

            }

        )


        .then(res=>res.json())


        .then(data=>{


            alert(data.message);


            loadCards();


        });



    };









    const filteredCards = cards.filter((card)=>{


        const text = search.toLowerCase();


        return(

            String(card.card_id || "")
            .toLowerCase()
            .includes(text)


            ||

            String(card.name || "")
            .toLowerCase()
            .includes(text)


            ||

            String(card.student_id || "")
            .toLowerCase()
            .includes(text)


        );


    });









return(


<div style={{padding:"20px"}}>


<Typography variant="h4">

Smart Cards Management

</Typography>






<TextField

label="Search Card / Student"

value={search}

onChange={(e)=>setSearch(e.target.value)}

sx={{margin:"20px 0"}}

/>









<TableContainer component={Paper}>


<Table>


<TableHead>


<TableRow>


<TableCell>ID</TableCell>

<TableCell>Card ID</TableCell>

<TableCell>Student</TableCell>

<TableCell>Student ID</TableCell>

<TableCell>Status</TableCell>

<TableCell>Issue Date</TableCell>

<TableCell>Action</TableCell>


</TableRow>


</TableHead>







<TableBody>


{

filteredCards.map((card)=>(


<TableRow key={card.id}>


<TableCell>

{card.id}

</TableCell>



<TableCell>

{card.card_id}

</TableCell>




<TableCell>

{card.name || "Unknown"}

</TableCell>




<TableCell>

{card.student_id}

</TableCell>




<TableCell>

{card.status}

</TableCell>




<TableCell>

{card.issue_date}

</TableCell>





<TableCell>


{

card.status === "active" &&

<Button

color="error"

variant="contained"

onClick={()=>blockCard(card.card_id)}

>

Block

</Button>


}



</TableCell>




</TableRow>


))


}



</TableBody>


</Table>


</TableContainer>




</div>


);


}



export default Cards;