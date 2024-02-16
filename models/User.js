const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  local: {
    password: {
      type: String,
    },
  },
  // 社交账户信息
  google: {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: String,
    displayName: String,
    profilePicture: String,
  },

  // 共通的用户信息
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  updateEmailToken: String,
  deleteAccountToken: String,
  signUpEmailVerifyToken: String,
  displayName: String,
  profilePicture: String,
  likedPerson: [Number],

  likedAnime: [Number],

  watchlist: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        items: [Number],
      },
    ],
  },

  history: [
    {
      mal_id: {
        type: Number,
        required: true,
      },
      visitedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // 其他用户信息，例如性别、生日等
  // ...
});

// 在保存用户之前加密密码（如果密码被修改）
userSchema.pre("save", async function (next) {
  if (!this.isModified("local.password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.local.password = await bcrypt.hash(this.local.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实用方法，例如验证密码
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.local.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
