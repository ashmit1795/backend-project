import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";

// Create a new playlist
const createPlaylist = asyncHandler(async (req, res, next) => {
    const {name, description} = req.body;
    const owner = req.user._id;
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const playlistExists = await Playlist.findOne({$and: [{name: name}, {owner: owner}]});
    if(playlistExists) {
        throw new ApiError(400, "Playlist already exists");
    };

    const playlist = await Playlist.create({name: name, description: description, owner: owner});
    if (!playlist) {
        throw new ApiError(500, "Playlist could not be created");
    }

    res.status(201).json(new ApiResponse(playlist, "Playlist created successfully", 201));
});

// Get all playlists created by a user
const getUserPlaylists = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const playlists = await Playlist.find({owner: userId}).populate("videos");
    if (!playlists) {
        throw new ApiError(404, "No playlists found");
    }

    res.status(200).json(new ApiResponse(playlists, "Playlists retrieved successfully", 200));
});

// Add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res, next) => {
    const { videoId, playlistId } = req.params;
    if (!videoId || !playlistId) {
        throw new ApiError(400, "Video ID and Playlist ID are required");
    }

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const updatedPLaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet: {videos: videoId}
        }, {new: true}
    );

    if (!updatedPLaylist) {
        throw new ApiError(500, "Video could not be added to the playlist");
    }

    res.status(200).json(new ApiResponse(updatedPLaylist, "Video added to playlist successfully", 200));
});

// Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res, next) => {
    const { videoId, playlistId } = req.params;
    if (!videoId || !playlistId) {
        throw new ApiError(400, "Video ID and Playlist ID are required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the video exists in the playlist
    const videoIndex = playlist.videos.indexOf(videoId);
    if(videoIndex === -1) {
        throw new ApiError(404, "Video not found in the playlist");
    }

    const updatedPLaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $pull: {videos: videoId}
        }, {new: true}
    );

    if(!updatedPLaylist){
        throw new ApiError(500, "Video could not be removed from the playlist");
    }

    res.status(200).json(new ApiResponse(updatedPLaylist, "Video removed from playlist successfully", 200));
});

// Get playlist by id
const getPlaylistById = asyncHandler(async (req, res, next) => {
    const { playlistId } = req.params;
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(new ApiResponse(playlist, "Playlist retrieved successfully", 200));
});

// Delete a playlist
const deletePlaylist = asyncHandler(async (req, res, next) => {
    const { playlistId } = req.params;
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
        throw new ApiError(500, "Playlist could not be deleted");
    }

    res.status(200).json(new ApiResponse({}, "Playlist deleted successfully", 200));
});

// Update a playlist
const updatePlaylist = asyncHandler(async (req, res, next) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            name: name,
            description: description
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Playlist could not be updated");
    }

    res.status(200).json(new ApiResponse(updatedPlaylist, "Playlist updated successfully", 200));
});

export { createPlaylist, getUserPlaylists, addVideoToPlaylist, removeVideoFromPlaylist, getPlaylistById, deletePlaylist, updatePlaylist };