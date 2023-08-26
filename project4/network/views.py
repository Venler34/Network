from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
import json
from .models import User, Post

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.timezone import activate

def index(request):
    return render(request, "network/index.html")
    
def posts(request):
    p = Paginator(Post.objects.all(), 10)

    index = request.GET.get("index", 1)
    page = p.page(index)

    arr = []

    for post in page:
        currentDict = {
            "username" : post.owner.username,
            "content" : post.content,
            "dateCreated" : post.created,
            "likes" : post.likes.count() if (post.likes) else 0,
            "postID" : post.pk
        }
        arr.append(currentDict)

    arr.append({
        "hasNext" : page.has_next(),
        "hasPrev" : page.has_previous()
    })
    return JsonResponse(arr, safe=False)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def newPost(request):
    if(request.method == "POST"):
        content = request.POST["content"]
        username = request.POST["username"]

        # store post in database associated with user
        user = User.objects.get(username=username)
        post = Post(content=content, owner=user)
        post.save()

        return HttpResponseRedirect(reverse("index"))


    return render(request, "network/newPost.html")

def viewProfile(request, username):
    owner = User.objects.get(username=username)
    if request.method == "POST":
        # follow or unfollow user
        user = request.POST["user"]
        currentUser = User.objects.get(username=user)

        if owner in currentUser.following.all():
            # unfollow
            currentUser.following.remove(owner)
        else:
            # follow
            currentUser.following.add(owner)
        
    return render(request, "network/profile.html", {
        "owner" : owner
    })


@csrf_exempt
@login_required
def savePost(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        postID = data.get("postID")
        newContent = data.get("newContent")

        post = Post.objects.get(pk=postID)

        if(post.owner.username == username):
            post.content = newContent
            post.save()

            return JsonResponse({"changeWorked" : True})

    return JsonResponse({"changeWorked": False})

@csrf_exempt
@login_required
def changeLikes(request):
    # Still getting 500 internal server error
    if request.method == "POST":
        data = json.loads(request.body)
        postID = data.get("postID")
        currentUser = data.get("currentUser")

        # error accessing the currentUser / post maybe
        post = Post.objects.get(pk=postID)
        user = User.objects.get(username = currentUser)

        if user not in post.likes.all():
            post.likes.add(user)
            post.save()
        else:
            post.likes.remove(user)
            post.save()
        
        return JsonResponse({"numberOfLikes" : post.likes.count()})
    
    elif request.method == "GET":
        # check whether current user liked the post or not
        username = request.GET.get('username')
        postID = request.GET.get('postID')
        user = User.objects.get(username=username)
        post = Post.objects.get(pk=postID)

        if post.likes and user in post.likes.all():
            return JsonResponse({'didLike': True})
        else:
            return JsonResponse({'didLike': False})
    
    return JsonResponse({"Works" : "Bad Request"}, status=200) # bad request

def getProfile(request):
    if request.method == "GET":
        # get user information
        username = request.GET.get('username')
        user = User.objects.get(username=username)

        userPosts = []
        for post in user.posts.all():
            postInfo = {
                "content" : post.content,
                "postID" : post.pk,
                "created" : post.created,
                "likes" : post.likes.count()
            }
            userPosts.append(postInfo)
        


        userInfo = {
            "followers" : user.followers.count(),
            "following" : user.following.count(),
            "posts" : userPosts
        }

        return JsonResponse(userInfo)

# Returns if current user is following owner 
def seeFollowings(request):
    if request.method == "POST":
        username = request.POST.get("username")
        ownerName = request.POST.get("ownerName")

        currentUser = User.objects.get(username=username)
        owner = User.objects.get(ownerName=ownerName)

        if owner in currentUser.following.all():
            # unfollow
            currentUser.following.remove(owner)
        else:
            # follow
            currentUser.following.add(owner)

        return JsonResponse({"following" : owner in currentUser.following.all()})
    elif request.method == "GET":
        username = request.GET.get("username")
        ownername = request.GET.get("ownername")

        currentUser = User.objects.get(username=username)
        owner = User.objects.get(username=ownername)

        return JsonResponse({"following" : owner in currentUser.following.all()})
        
def getAllFollowingPosts(request):
    if request.method == "GET":
        username = request.GET.get("username")
        user = User.objects.get(username=username)

        followingPosts = []

        for user in user.following.all():
            for post in user.posts.all():
                postInfo = {
                    "username" : user.username,
                    "content" : post.content,
                    "postID" : post.pk,
                    "created" : post.created,
                    "likes" : post.likes.count()
                }
                followingPosts.append(postInfo)

        return JsonResponse(followingPosts, safe=False)
