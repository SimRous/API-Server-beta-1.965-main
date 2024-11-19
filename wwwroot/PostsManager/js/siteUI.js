//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let hold_Periodic_Refresh = false;
let currentETag = "";
const periodicRefreshPeriod = 10;
let rowHeight = 200;
let search = "";
let searchCategory = "Nothing";
let endOfData = false;
let pageManager;
let postItemLayout;
let ducktape = false;
Init_UI();

function getLimit() {
    // estimate the value of limit according to height of content
    console.log(Math.round($("#content").innerHeight() / rowHeight));
    return Math.round($("#content").innerHeight() / rowHeight);
}
function Init_UI() {
    postItemLayout = {
        width: $("#sample").outerWidth(),
        height: $("#sample").outerHeight()
    };
    $("#sample").hide();
    $('#createContact').on("click", async function () {
        renderPostForm();
    });
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        console.log("hi");
    });
    $("#searchKey").on("change", () => {
        doSearch();
    })
    $('#doSearch').on('click', () => {
        doSearch();
    })
    $(document).on('click', '.category-item', function (event) {
        let category = $(event.currentTarget).attr('name');
        let list = document.getElementById("dropdown");
        list = $(list).children();
        $(list).each(function(index) {
            $($(this)).children().first().attr('class', '');
        });
        
        $(event.currentTarget).children().first().attr('class', 'fa-solid fa-check');
        searchCategory = category;
        endOfData = false;
        pageManager.reset();
    });

    pageManager = new PageManager('scrollPanel', 'itemsPanel', postItemLayout, renderPosts);
    showPosts();
    start_Periodic_Refresh();
    showCategory();


}
function showPosts() {
    $("#actionTitle").text("La prèce plusse");
    $("#scrollPanel").show();
    $('#abort').hide();
    $('#dropdownToggle').show();
    $('#doSearch').show();
    $('#searchKey').show();
    $('#postFormContainer').hide();
    $('#aboutContainer').hide();
    $("#createPost").show();
    
    hold_Periodic_Refresh = false;
}
function hidePosts() {
    $("#scrollPanel").hide();
    $("#createPost").hide();
    $('#searchKey').hide();
    $('#doSearch').hide();
    $('#dropdownToggle').hide();
    $("#abort").show();
    hold_Periodic_Refresh = true;
}
function doSearch() {
    search = $("#searchKey").val().replace(' ', ',');
    endOfData = false;
    pageManager.reset();
}
async function showCategory() {
    let allPost = await Posts_API.Get();
    let allCategory = [];
    allPost.data.forEach(post => {
        if (!allCategory.includes(post.Category))
            allCategory.push(post.Category);
    });
    let list = document.getElementById("dropdown");
    allCategory.forEach(category => {
        list.innerHTML += renderCategory(category);
    });
}
function renderAbout() {
    eraseContent();
    $("#search").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Dictionnaire de mots</h2>
                <hr>
                <br>
                <p>
                    Petite application à titre de démonstration
                    d'interface utilisateur monopage réactive avec 
                    défilement infinie.                    
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderPosts(queryString) {
    hold_Periodic_Refresh = false;
    queryString += "&sort=Creation,desc";

    if (search != "") queryString += "&keywords=" + search;
    if (searchCategory != "Nothing") queryString += "&Category=" + searchCategory
    console.log(queryString);
    $("#createContact").show();
    $("#search").show();
    $("#abort").hide();

    if (!endOfData) {
        let posts = await Posts_API.Get(queryString);

        if (posts !== null) {

            currentETag = posts.ETag;
            if (posts.data.length > 0) {
                console.log(posts.data.length);
                posts.data.forEach(post => {
                    $("#itemsPanel").append(renderPost(post));

                });

            } else {
                endOfData = true;
            }
        }
    } else {
        renderError("Service introuvable");
    }
    $('.cmdEdit').off('click');
    $('.cmdDelete').off('click');
    $(".cmdEdit").on("click", function () {
        renderEditPostForm($(this).attr("editPostId"));
    });
    $(".cmdDelete").on("click", function () {
        console.log("problem");
        renderDeletePostForm($(this).attr("deletePostId"));
    });
    $('.postSeeMoreContainer').off('click');
    $('.postSeeMoreContainer').on("click", function () {
        if ($(this).parent().children().first().hasClass("postDescClamped")) {
            $(this).parent().children().first().attr('class', '');
            $(this).parent().children().eq(1).children().first().attr('class', 'cmdIcon fa-solid fa-arrow-up');
        }
        else {
            $(this).parent().children().first().attr('class', 'postDescClamped');
            $(this).parent().children().eq(1).children().first().attr('class', 'cmdIcon  fa-solid fa-arrow-down');
        }
    });
    return endOfData;
}
function newPost() {
    post = {};
    post.Id = 0;
    post.Title = "";
    post.Category = "";
    post.Image = "";
    post.Creation = "";
    post.Text = "";
    return post;
}
function renderPostForm(post = null) {
    hidePosts();
    $("#abort").show();
    hold_Periodic_Refresh = true;

    let create = post == null;
    if (create) {
        post = newPost();
        post.Image = "images/no-image.jpg";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#postFormContainer").show();
    $("#postFormContainer").empty();
    $("#postFormContainer").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>

            <label for="Title" class="form-label">Titre de l'article </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre de l'article"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${post.Title}"
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input
                class="form-control Alpha"
                name="Category"
                id="Category"
                placeholder="ex: SANTÉ"
                required
                RequireMessage="Veuillez entrer un titre" 
                InvalidMessage="Veuillez entrer une catégorie valide"
                value="${post.Category}" 
            />
            <label for="Text" class="form-label">Description </label>
            <input 
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Voici la description de l'article..."
                required
                RequireMessage="Veuillez entrer une description" 
                InvalidMessage="Veuillez entrer une description valide"
                value="${post.Text}"
            />
            <input 
                type="hidden"
                name="Creation"
                id="Creation"
                placeholder="Voici la description de l'article..."
                required
                RequireMessage="Veuillez entrer une description" 
                InvalidMessage="Veuillez entrer une description valide"
                value="${new Date().getTime()}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Photo de l'évènement </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Image' 
                   imageSrc='${post.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        console.log(post);
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            showPosts();
            await pageManager.update(false);
            //compileCategories();
            pageManager.scrollToElem(post.Id);
        }
        else
            renderError("Une erreur est survenue! " + Posts_API.currentHttpError);
    });
    $('#cancel').on("click", function () {
        showPosts();
    });
}
function showWaitingGif() {
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function eraseContent() {
    showWaitingGif();
    $("#itemsPanel").empty();
}
function renderCategory(category) {
    return `
        <div class="dropdown-item category-item" name="${category}">
            <i class=""></i> ${category}
        </div> 
    `;
}
function renderPost(post) {

    return $(`
     <div class="postContainer">
            <div class="postHeader">
                <div class="postCategory">${post.Category}</div>
                <div class="postActionIcon"><i class="cmdEdit cmdIcon fa-solid fa-pen" editPostId="${post.Id}"></i></div>
                <div class="postActionIcon"><i class="cmdDelete cmdIcon fa-solid fa-trash-can" deletePostId="${post.Id}"></i></div>
            </div>
            <div class="postTitle">${post.Title}</div>
            <div class="postImage"><img src="${post.Image}"></div>
            <div class="postDate">${convertToFrenchDate(post.Creation)}</div>
            <div>
                <div class="postDescClamped">${post.Text}</div>
                <div class="postSeeMoreContainer"><i class="cmdIcon  fa-solid fa-arrow-down"></i></div>
            </div>
        </div>          
    `);
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function convertToFrenchDate(numeric_date) {
    date = new Date(numeric_date);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var opt_weekday = { weekday: 'long' };
    var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    return weekday + " le " + date.toLocaleDateString("fr-FR", options) + " à " + date.toLocaleTimeString("fr-FR");
}
async function renderEditPostForm(id) {
    let post = await Posts_API.Get(id);

    if (post !== null)
        renderPostForm(post.data);

    else
        renderError("Contact introuvable!");
}
async function renderDeletePostForm(id) {
    
    hidePosts();
    $("#abort").show();
    hold_Periodic_Refresh = true;
    
    $("#actionTitle").text("Retrait");
    $('#postFormContainer').show();
    $('#postFormContainer').empty();

    let post = await Posts_API.Get(id);
    if (post !== null) {
        post = post.data;
        $("#postFormContainer").append(`
        <div class="postdeleteForm">
            <h4>Effacer la nouvelle suivante?</h4>
            <br>
            <div class="postContainer" post_id=${post.Id}>
            <div class="postHeader">
                <div class="postCategory">${post.Category}</div>
            </div>
            <div class="postTitle">${post.Title}</div>
            <div class="postImage"><img src="${post.Image}"></div>
            <div class="postDate">${convertToFrenchDate(post.Creation)}</div>
            <div>
                <div class="postDescClamped">${post.Text}</div>
                
            </div>
            <hr>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>   
            
            
        </div>    
        `);
        $('#deletePost').on("click", async function () {
            let result = await Posts_API.Delete(post.Id);
            if (result)
                showPosts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            showPosts();
        });
    } else {
        renderError("Contact introuvable!");
    }
}
function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                await pageManager.update(false);
                compileCategories();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}