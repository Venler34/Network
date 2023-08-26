
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("newPost", views.newPost, name="newPost"),
    path("viewProfile/<str:username>", views.viewProfile, name="viewProfile"),
    path("posts", views.posts, name="posts"),
    path("savePost", views.savePost, name="savePost"),
    path("changeLikes", views.changeLikes, name="changeLikes"),
    path("getProfile", views.getProfile, name="getProfile"),
    path("seeFollowings", views.seeFollowings, name="seeFollowings"),
    path("getAllFollowingPosts", views.getAllFollowingPosts, name="getAllFollowingPosts")
]
