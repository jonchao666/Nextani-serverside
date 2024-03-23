const express = require("express");
const Anime = require("../models/Anime");
const router = express.Router();
const User = require("../models/User");
const People = require("../models/People");
const xss = require("xss");
module.exports = router;

const select =
  "apiData.images.webp.large_image_url apiData.title apiData.type apiData.score apiData.aired.prop.from.year apiData.genres.name mal_id apiData.synopsis";
//likedAnime
router.get("/likedAnime", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Extract page and limit from query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8; // Default limit
    const skip = (page - 1) * limit;

    // Slice the user's likedAnime list for pagination
    const paginatedLikedAnimeIds = user.likedAnime.slice(skip, skip + limit);

    // Find the Anime documents for the paginated IDs
    const likedAnimes = await Anime.find({
      mal_id: { $in: paginatedLikedAnimeIds },
    }).select(select);

    // Sort the results according to the order of IDs in paginatedLikedAnimeIds
    likedAnimes.sort((a, b) => {
      const aIndex = paginatedLikedAnimeIds.indexOf(a.mal_id);
      const bIndex = paginatedLikedAnimeIds.indexOf(b.mal_id);
      return aIndex - bIndex;
    });

    res.json(likedAnimes);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//confirm if liked anime
router.get("/ifAnimeLiked/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const { mal_id } = req.params;

    const isLiked = user.likedAnime.includes(Number(mal_id));

    res.json({ isLiked });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/likedAnimeAdd", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.body;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedAnime.unshift(Number(mal_id));
    await user.save();
    res.json({ message: "Saved to favorite anime." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/likedAnime/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.params;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedAnime = user.likedAnime.filter((id) => id !== Number(mal_id));

    await user.save();
    res.json({ message: "Deleted from favorite anime." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.get("/likedPerson", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8; // Default limit
    const skip = (page - 1) * limit;

    // Slice the user's likedPerson list for pagination
    const paginatedLikedPersonIds = user.likedPerson.slice(skip, skip + limit);

    // Find the People documents for the paginated IDs
    const likedPeople = await People.find({
      mal_id: { $in: paginatedLikedPersonIds },
    });

    // Sort the results according to the order of IDs in paginatedLikedPersonIds
    likedPeople.sort((a, b) => {
      const aIndex = paginatedLikedPersonIds.indexOf(a.mal_id);
      const bIndex = paginatedLikedPersonIds.indexOf(b.mal_id);
      return aIndex - bIndex;
    });

    res.json(likedPeople);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//confirm if person liked
router.get("/ifPersonLiked/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const { mal_id } = req.params;

    const isLiked = user.likedPerson.includes(Number(mal_id));
    res.json({ isLiked });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/likedPersonAdd", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.body;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedPerson.unshift(Number(mal_id));
    await user.save();
    res.json({ message: "Saved to favotite Person" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/likedPerson/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.params;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedPerson = user.likedPerson.filter((id) => id !== Number(mal_id));

    await user.save();
    res.json({ message: "Deleted from favorite person" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//history
router.get("/history", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 14; // Default limit
    const skip = (page - 1) * limit;

    // Paginate the user's history
    const paginatedHistory = user.history.slice(skip, skip + limit);
    const mal_ids = paginatedHistory.map((item) => item.mal_id);

    // Fetch the corresponding Anime documents in one query
    const animeDocuments = await Anime.find({
      mal_id: { $in: mal_ids },
    }).select(select);

    // Merge history with Anime details
    const historyWithDetails = paginatedHistory.map((historyItem) => {
      const animeDetail = animeDocuments.find(
        (anime) => anime.mal_id === historyItem.mal_id
      );
      return {
        ...historyItem.toObject(),
        animeDetail,
      };
    });

    res.json(historyWithDetails);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/historyAdd", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.body;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    // Remove the existing entry if it exists
    user.history = user.history.filter(
      (entry) => entry.mal_id !== Number(mal_id)
    );

    // Create a new history entry
    const newHistoryEntry = {
      mal_id: Number(mal_id),
      visitedOn: new Date(),
    };

    // Add the new entry to the beginning of the history array
    user.history.unshift(newHistoryEntry);

    await user.save();
    res.json({ message: "History updated" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/history/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { mal_id } = req.params;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.history = user.history.filter(
      (item) => item.mal_id !== Number(mal_id)
    );

    await user.save();
    res.json({ message: "All views of this anime removed from history" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//delete all history
router.delete("/history", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // 清空历史记录
    user.history = [];
    await user.save();

    res.json({ message: "History cleared successfully" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//watchlist
router.get("/watchlist/:name", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { name } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 14; // Default limit
    const skip = (page - 1) * limit;

    let watchlists = [];

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    // Apply skip and limit to the items of the found watchlist
    const paginatedItems = watchlist.items.slice(skip, skip + limit);

    const detailedItems = await Anime.find({
      mal_id: { $in: paginatedItems },
    }).select(select);
    detailedItems.sort((a, b) => {
      // 根据 paginatedItems 中的顺序来排序
      const aIndex = paginatedItems.indexOf(a.mal_id);
      const bIndex = paginatedItems.indexOf(b.mal_id);
      return aIndex - bIndex;
    });

    watchlists = [
      {
        ...watchlist.toObject(),
        items: detailedItems,
      },
    ];

    res.json(watchlists);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//watchlists
router.get("/watchlists/", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 14;
    const skip = (page - 1) * limit;

    const paginatedWatchlists = user.watchlist.slice(skip, skip + limit);

    let mal_ids = [];
    paginatedWatchlists.forEach((item) => {
      mal_ids.push(...item.items.slice(0, 2));
    });

    const animeDocuments = await Anime.find({
      mal_id: { $in: mal_ids },
    }).select(select);

    const watchlistWithDetails = paginatedWatchlists.map((watchlistItem) => {
      const animeDetails = watchlistItem.items
        .slice(0, 2)
        .map((mal_id) => {
          return animeDocuments.find((anime) => anime.mal_id === mal_id);
        })
        .filter((anime) => anime);
      return {
        ...watchlistItem.toObject(),
        animeDetails,
      };
    });

    res.json(watchlistWithDetails);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//watchlists without animedetails
router.get("/watchlistsWithoutAnimeDetails/", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.json(user.watchlist);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//get all Watchlists which anime In
router.get("/animeInWatchlists/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    const { mal_id } = req.params;

    const watchlistsContainingAnime = user.watchlist.filter((watchlist) =>
      watchlist.items.includes(Number(mal_id))
    );

    res.json(watchlistsContainingAnime);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/watchlist/create", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    let { name, mal_id } = req.body;

    name = xss(name.trim());

    if (name.length < 1 || name.length > 150) {
      return res
        .status(400)
        .send("The name must be between 1 and 150 characters long.");
    }

    if (
      !/^[\w\s,.!?;:'"@#$%^&*()+=_\u4e00-\u9fff\u3040-\u309F\u30A0-\u30FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF-]*$/.test(
        name
      )
    ) {
      return res.status(400).send("The name contains invalid characters.");
    }

    if (
      user.watchlist.some((w) => w.name.toLowerCase() === name.toLowerCase())
    ) {
      return res.status(400).send("A list with the same name already exists.");
    }

    const MAX_WATCHLIST_COUNT = 5000;
    if (user.watchlist.length >= MAX_WATCHLIST_COUNT) {
      return res
        .status(400)
        .send(`You can only create up to ${MAX_WATCHLIST_COUNT} watchlists.`);
    }

    const newWatchlistEntry = {
      name,
      items: mal_id ? [Number(mal_id)] : [],
    };

    user.watchlist.unshift(newWatchlistEntry);

    await user.save();

    res.json({ message: "List created successfully." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/watchlist/:name", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { name } = req.params;

    const watchlistExists = user.watchlist.some((w) => w.name === name);
    if (!watchlistExists) {
      return res.status(404).send("Watchlist not found");
    }

    user.watchlist = user.watchlist.filter((w) => w.name !== name);
    await user.save();

    res.json({ message: "Watchlist deleted successfully" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/watchlist/:name/addItem", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { name } = req.params;
    const { mal_id } = req.body;

    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }
    if (!name) {
      return res.status(400).send("Name is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);

    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    // Limit the number of items in each watchlist
    const MAX_ITEMS_PER_WATCHLIST = 5000;
    if (watchlist.items.length >= MAX_ITEMS_PER_WATCHLIST) {
      return res
        .status(400)
        .send(
          `Each watchlist can only contain up to ${MAX_ITEMS_PER_WATCHLIST} items.`
        );
    }

    if (watchlist.items.includes(Number(mal_id))) {
      return res.status(400).send("Anime already in watchlist");
    }

    watchlist.items.unshift(Number(mal_id));

    await user.save();

    res.json({ message: `Saved to ${name}` });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/watchlist/:name/item/:mal_id", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { name, mal_id } = req.params;
    if (!name) {
      return res.status(400).send("Watchlist name is required");
    }
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    watchlist.items = watchlist.items.filter((item) => item !== Number(mal_id));

    await user.save();

    res.json({ message: `Removed from ${name}` });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.patch("/watchlist/rename/:oldName", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { oldName } = req.params;
    const { newName } = req.body;
    const cleanedNewName = xss(newName.trim());
    if (!oldName || !newName) {
      return res.status(400).send("Both old name and new name are required");
    }

    const watchlist = user.watchlist.find((w) => w.name === oldName);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    if (user.watchlist.some((w) => w.name === newName)) {
      return res
        .status(400)
        .send("Another watchlist with the new name already exists");
    }

    watchlist.name = cleanedNewName;
    await user.save();

    res.json({ message: "Name changed successfully" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.patch("/watchlist/updateDescription/:name", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { name } = req.params;
    const { description } = req.body;
    const cleanedDescription = xss(description);
    if (!name) {
      return res.status(400).send("Watchlist name is required");
    }
    if (description === undefined) {
      return res.status(400).send("New description is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    watchlist.description = cleanedDescription;
    await user.save();

    res.json({ message: "Description updated" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});
