document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#following').style.display = 'none';
    document.querySelector('#allposts').style.display = 'block';
    document.querySelector('#profile').style.display = 'none';

    const getCurrentUser = () => {
        return document.querySelector("#currentUser").textContent.trim();
    }

    const getDateFromString = (str) => {
        var date = new Date(str)
        return date.toString()
    }
    

    const followingButton = document.querySelector('#FollowingButton');
    if(followingButton != null){
        followingButton.addEventListener('click', () => {
            document.querySelector('#following').style.display = 'block';
            document.querySelector('#allposts').style.display = 'none';
            document.querySelector('#profile').style.display = 'none';

            console.log(getCurrentUser())
            fetch(`getAllFollowingPosts?username=${getCurrentUser()}`)
            .then(response => response.json())
            .then(data => data.forEach(post => {
                const content = document.createElement('div')
                const ownerName = post.username
                const dateCreated = getDateFromString(post.created);
                const pageContent = post.content
                const numLikes = post.likes
                const currentUser = getCurrentUser();

                heading = document.createElement('h4')

                heading.textContent = `${ownerName}`
                heading.addEventListener("click", (event) => {
                    displayProfilePosts(event.target.textContent)
                })

                mainContent = document.createElement('p')
                mainContent.textContent = pageContent

                displayLikes = document.createElement('div')
                displayLikes.textContent = `Likes: ${numLikes}`

                content.append(heading)
                content.append(mainContent)
                content.append(displayLikes)

                if(currentUser && currentUser !== ownerName) {
                    // ADD LIKE BUTTON
                    likeButton = generateLikeButton(post.postID, currentUser)
                    content.append(likeButton)
                }

                dateCreatedBox = document.createElement('p')

                // Make necessary adjustments to datecreated
                dateCreatedBox.textContent = `Created: ${dateCreated}`
                
                content.append(dateCreatedBox)

                const box = document.querySelector('#following');
                while(box.firstChild) {
                    box.removeChild(box.firstChild);
                }
                document.querySelector('#following').append(content)
            }))
        })
    }

    const generateLikeButton = (postID, currentUser) => {
        const likeButton = document.createElement('button')
        likeButton.dataset.postID = postID
        displayLikes.class = "displayLikes"
        fetch(`changeLikes?username=${currentUser}&postID=${postID}`)
        .then(response => response.json())
        .then(data => {
            if(data.didLike) {
                likeButton.textContent = "Unlike";
            } else {
                likeButton.textContent = "Like";
            }
        })
        likeButton.style.width = "fit-content"

        likeButton.addEventListener('click', function() {
            fetch('changeLikes', {
                method: 'POST',
                body: JSON.stringify({
                    'postID' : this.dataset.postID,
                    'currentUser' : currentUser
                })
            }).then(response => response.json())
            .then(data => {
                // update the visuals
                this.parentNode.querySelector('div').textContent = `Likes: ${data.numberOfLikes}`
                if(this.textContent === "Like") {
                    this.textContent = "Unlike";
                } else {
                    this.textContent = "Like"
                }
            })
        })
        return likeButton
    }

    // implement the profile page into the index page so that it can transition better
    function displayProfilePosts(username) {
        document.querySelector('#following').style.display = 'none';
        document.querySelector('#allposts').style.display = 'none';
        document.querySelector('#profile').style.display = 'block';

        currentUser = getCurrentUser()
    
        fetch(`getProfile?username=${username}`)
        .then(response => response.json())
        .then(data => {
            // Main page
            document.querySelector('#username').textContent = username;
            document.querySelector('#profileFollowers').textContent = `Followers: ${data.followers}`;
            document.querySelector('#profileFollowing').textContent = `Following: ${data.following}`;

            // Add follow button (can't follow if owner or not signed in)
            if(currentUser && currentUser !== username) {
                follow = document.createElement('button');
                console.log(username)
                console.log(currentUser)
                fetch(`seeFollowings?username=${currentUser}&ownername=${username}`)
                .then(response => response.json())
                .then(data => {
                    if(data.following) {
                        follow.textContent = "Unfollow"
                    } else {
                        follow.textContent = "Follow"
                    }
                })
                follow.style.width = 'fit-content'
                // clear followButton of any other buttons
                const followButtonArea = document.querySelector('#followButton')
                while(followButtonArea.firstChild) {
                    followButtonArea.removeChild(followButtonArea.firstChild)
                }
                followButtonArea.append(follow)
            }

            // Display posts

            posts = data.posts

            displayPosts = document.createElement('div')

            posts.forEach(post => {
                thisPost = document.createElement('div');

                postHeading = document.createElement('h4');
                postHeading.textContent = `${username}`

                postContent = document.createElement('p')
                postContent.textContent = post.content;
                
                postLikes = document.createElement('div')
                postLikes.textContent = `Likes: ${post.likes}`;

                postDate = document.createElement('p');
                postDate.textContent = `Created: ${getDateFromString(post.created)}`;

                thisPost.append(postHeading);
                thisPost.append(postContent);
                thisPost.append(postLikes);
                if(currentUser && currentUser !== username) {
                    thisPost.append(generateLikeButton(post.postID, getCurrentUser()))
                }
                thisPost.append(postDate);

                displayPosts.append(thisPost);
            })

            thePosts = document.querySelector('#posts')
            while(thePosts.firstChild) {
                thePosts.removeChild(thePosts.firstChild);
            }
            document.querySelector('#posts').append(displayPosts);
        })
    }


    let index = 1;

    function generatePosts() {
        document.querySelector("#allposts").innerHTML = ""

        fetch(`posts?index=${index}`)
        .then(response => response.json())
        .then(data => data.forEach(post => addPosts(post)))
    }

    function addPosts(post) {
        if(post["hasNext"] !== undefined) {
            if(post["hasPrev"]) {
                const prev = document.createElement("button");
                prev.textContent = "Previous"
                prev.addEventListener("click", function() {
                    index -= 1;
                    generatePosts();
                })
                prev.style.width = "fit-content"
                document.querySelector("#allposts").append(prev);
            }
            if(post["hasNext"]) {
                const next = document.createElement("button");
                next.textContent = "Next";
                next.addEventListener("click", function() {
                    index += 1;
                    generatePosts();
                })
                next.style.width = "fit-content"
                document.querySelector("#allposts").append(next);
            }
        } else {

            const content = document.createElement('div')
            const ownerName = post.username
            const dateCreated = getDateFromString(post.dateCreated);
            const pageContent = post.content
            const numLikes = post.likes
            const currentUser = getCurrentUser();

            heading = document.createElement('h4')

            // const link = document.createElement('a')
            heading.textContent = `${ownerName}`
            heading.addEventListener("click", (event) => {
                displayProfilePosts(event.target.textContent)
            })
            // link.href = `viewProfile/${ownerName}`
            //     displayProfilePosts(this.textContent)
            // });

            // heading.append(link)

            mainContent = document.createElement('p')
            mainContent.textContent = pageContent

            displayLikes = document.createElement('div')
            displayLikes.textContent = `Likes: ${numLikes}`

            content.append(heading)
            content.append(mainContent)
            content.append(displayLikes)

            if(currentUser && currentUser !== ownerName) {
                // ADD LIKE BUTTON
                likeButton = generateLikeButton(post.postID, currentUser)
                content.append(likeButton)
            }

            dateCreatedBox = document.createElement('p')

            // Make necessary adjustments to datecreated
            dateCreatedBox.textContent = `Created: ${dateCreated}`
            
            content.append(dateCreatedBox)

            // add edit button
            if(currentUser === ownerName) {
                const editButton = document.createElement("button");

                editButton.dataset.postID = post.postID;

                editButton.addEventListener('click', function() {
                    text = document.createElement('textarea');
                   
                    while(content.firstChild) {
                        content.removeChild(content.firstChild);
                    }

                    content.append(text)

                    save = document.createElement('button');
                    save.textContent = "Save";
                    save.style.width = "fit-content"
                    save.dataset.postID = post.postID
                    save.addEventListener('click', function() {
                        const newContent = text.value;
                        fetch('savePost', {
                            method: 'POST',
                            body: JSON.stringify({
                                username: `${currentUser}`,
                                postID: `${this.dataset.postID}`,
                                newContent: `${newContent}`
                            })
                        }).then(response => response.json())
                        .then(data => {
                            if(data.changeWorked) {
                                //Add all elements to post
                                sameHeading = document.createElement('h4');
                                diffContent = document.createElement('p')
                                sameLink = document.createElement('a');
                                sameDate = document.createElement('p');
                                sameLikes = document.createElement('p');

                                sameLink.textContent = `${ownerName}`
                                sameLink.href = `viewProfile/${ownerName}`
                                sameHeading.append(sameLink)

                                diffContent.textContent = newContent;
                                sameLikes = `Likes: ${numLikes}`;

                                //Date is the same for some dumb reason
                                sameDate.textContent = "Created: "
                                for(let i = 0; i < dateCreated.length-5; i++) {
                                    if(dateCreated.charAt(i) != 'T' && dateCreated.charAt(i) != 'Z') {
                                        sameDate.textContent += dateCreated.charAt(i)
                                    } else {
                                        sameDate.textContent += ' '
                                    }
                                }


                                const parent = this.parentNode;
                                parent.innerHTML = "";

                                parent.append(sameHeading);
                                parent.append(diffContent);
                                parent.append(sameLikes);
                                parent.append(sameDate);
                                parent.append(editButton);
                            } else {
                                console.log("no worked")
                            }
                        })
                        .catch(error => console.log(error))
                    })
                    content.append(save)
                })
                editButton.textContent = "Edit";
                editButton.style.width = "fit-content"
                content.append(editButton)
            }

            document.querySelector('#allposts').append(content)
        }
    }

    generatePosts()
})