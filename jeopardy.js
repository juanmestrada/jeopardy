// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

// number of active clues on board
let activeClues = 12;

 // Returns array of category ids
async function getCategoryIds() {
    const response = await axios.get('https://jservice.io/api/categories', {params: {count: 50}});

    return response.data;
}

// Return object with data about a category
async function getCategory(catId) {
    const response = await axios.get('https://jservice.io/api/category', {params: {id: catId}});

    // return category with only 2 clues
    return {
        id: response.data.id,
        title: response.data.title,
        clues: response.data.clues.slice(0,2)
    };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 *   (initally, just show a "?" where the question/answer would go.)
*/
function fillTable() {
    const board = $(`
        <div class="board">
        </div>
    `);

    $("#jeopardy").append(board);

    // number of clues currently added to board
    let cluesCount = 0;

    // random cell to add clue
    let randomIdx = Math.floor(Math.random() * (4 - 1 + 1) + 1);

    let prevCellId = null; 

    // add 2 clues to random cell per category
    for(let [i, category] of categories.entries()){

        const row = $(`
            <div class="category-row">
                <div class="category-title">
                    <span>${category.title}</span>
                </div>
                <div class="category-cell" data-id="${i}-1">
                </div>
                <div class="category-cell" data-id="${i}-2">
                </div>
                <div class="category-cell" data-id="${i}-3">
                </div>
                <div class="category-cell" data-id="${i}-4">
                </div>
                <div class="category-cell" data-id="${i}-5">
                </div>
            </div>
        `);

        board.append(row);

        // add clue to random board cell, max 2 clues *requirement*
        while (cluesCount < 2){
            if(randomIdx !== prevCellId){
                // set board cell to active-clue
                $(`[data-id="${i}-${randomIdx}"]`).addClass('active-clue');
                // add clue index to cell
                $(`[data-id="${i}-${randomIdx}"]`).attr('data-clue-id', cluesCount);
                $(`[data-id="${i}-${randomIdx}"]`).append(`<span>?</span>`);

                // update new prevCellId
                prevCellId = randomIdx;

                cluesCount++;
            }

            // get new random index for next cell
            randomIdx = Math.floor(Math.random() * (4 - 1 + 1) + 1);
        }

        // reset cluesCount for next category
        cluesCount = 0; 
    }
}

// Handle clicking on a clue: show the question or answer
function createClueCard(categoryIndex, clueIndex){
    const clueCard = $(`
        <div class="clue-card">
            <div class="clue-card-category">
                ${categories[categoryIndex].title}
            </div>
            <div class="clue-card-question">
                ${categories[categoryIndex].clues[clueIndex].question}
            </div>
            <div class="clue-card-answer hidden">
                ${categories[categoryIndex].clues[clueIndex].answer}
            </div>
        </div>
    `);

    $('body').append(clueCard);

    // animate clue card 
    clueCard.animate({
        left: 0
    }, 1200);
}

function handleClick(evt) {
    const catIdx = $(this).data("id").charAt(0);
    const clueIdx = $(this).data("clue-id");

    // show clicked clue card
    createClueCard(catIdx, clueIdx);

    // clue has been seen, remove active class
    $(this).removeClass("active-clue");
    $(this).find('span').remove();

    activeClues--;
}

/** Wipe the current Jeopardy board, show the loading spinner,
* and update the button used to fetch data.
*/
function showLoadingView() {
    $("#jeopardy").empty();

    $('#spin-container').addClass("loading");

    // reset variables
    categories.length = 0;
    activeClues = 12;
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
    $('#spin-container').removeClass("loading");
}

/** Start game:
 * - get random category Ids
 * - get data for each category
 * - create HTML table
* */
async function setupAndStart() {
    // prepare game
    showLoadingView();

    const categoryIdsResponse = await getCategoryIds();

    // number of categories
    let count = 6;
    let prevIdx = null;

    while(count > 0){
        let randomIdx = Math.floor(Math.random() * categoryIdsResponse.length);

        // update categories array with random unique categories
        if(prevIdx !== randomIdx){
            
            let randomCategory = await getCategory(categoryIdsResponse[randomIdx].id);
            
            // push category to categories array
            categories.push(randomCategory);

            // update previous index (prevIdx)
            prevIdx = randomIdx;

            count--;
        }
    }

    fillTable();
    hideLoadingView();

}

// intro display
function createIntro(){
    const startBtn = $(`<button class="startBtn">Start</button>`);

    const container = $(
    `<div class="intro-container">
        <div class="hero-title">
            JEOPARDY!
        </div>
    </div>`);

    $('body').append(container);

    // animate intro
    setTimeout(function(){
        $(".hero-title").addClass("active");
    }, 200);

    $(".hero-title").append(startBtn).delay(3200).queue(function (next) { 
        $(this).css('color', '#fefde4'); 
        next(); 
    })

    startBtn.delay(3200).animate({
      opacity: 1.0
    }, 650);
}

// alert player game over
function gameOver() {
    const restartPopup = $(`
        <div class="restart-container">
            <div class="restart-text">Game Over</div>
            <button class="restartBtn">Restart</button>
        </div>
    `);

    $('body').append(restartPopup);

    restartPopup.animate({
        top: "50%"
    }, 800);
}

createIntro();



document.addEventListener("DOMContentLoaded", function() {
    // start button click event
    $(".startBtn").on("click", function(){
        setupAndStart();

        $(".intro-container").remove();
    });

    // active board clue click event
    $("#jeopardy").on('click', '.active-clue', handleClick);

    // clue card click event
    $("body").on('click', '.clue-card', function(){

        // first click show answer, second click remove clue card
        if($(this).find(".clue-card-answer").hasClass("hidden")){

            $(this).find(".clue-card-answer").removeClass("hidden");

            return;
        }
        
        $(this).remove();

        // check if game over
        if(activeClues === 0){
            gameOver(); 
        }
    });

    // restart button click event
    $("body").on('click', '.restartBtn', function(){
        // start new game
        setupAndStart();

        // hide restart popup
        $(this).offsetParent().remove();
    });
});