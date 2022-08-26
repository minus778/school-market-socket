import {
  updateUserInfo,
  getUserfabu,
  getUserSell,
  getUserBuy
} from '../../network/index.js'
const state = {
  //用户信息
  userInfo: {},
  token: null,
  userSchool: {},
  userShop: {},
  chatUserAll: eval(uni.getStorageSync("chatUserAll")) || [],
  chatLastHistory: eval(uni.getStorageSync("chatLastHistory")) || []
}
const mutations = {
  //保存用户信息
  saveUserInfo(state, data) {
    // if(!data.nickname||!data.image){
    // 	data.nickname="请登录"
    // 	data.image = '../../static/images/tx.png'
    // }
    state.userInfo = data
    state.token = data.token
    //token持久化存储到本地
    uni.setStorageSync('login-token', data.token)
  },

  //保存用户学校信息
  saveUserSchool(state, data) {
    state.userSchool = data
    //持久化存储到本地
    uni.setStorageSync('userSchool', data)
  },
  //将本地学校信息赋值给仓库学校信息并将用户信息保存至服务器
  updateSchool(state) {
    state.userInfo.school = uni.getStorageSync('userSchool')
  },
  //修改用户信息
  updateInfo(state, data) {
    state.userInfo.image = data.image
    state.userInfo.nickname = data.nickname
    state.userInfo.gender = data.gender
    state.userInfo.openid = data.openid
    // state.userInfo.weChart = data.weChart
    // state.userInfo.qq = data.qq
    state.userInfo.phone = data.phone
    console.log('获取的用户信息：', state.userInfo)
  },
  //保存用户商品信息
  saveUserShop(state, data) {
    state.userShop = data
  },
  // 保存用户聊天对象的userId
  saveChatUser(state, data) {
    // 查找是否存在聊天
    let user = state.chatUserAll.find(item => item == data)
    if (!user) {
      if(data < 6){
      state.chatUserAll.push(data)
      }
    }
    //持久化存储到本地
    uni.setStorageSync('chatUserAll', JSON.stringify(state.chatUserAll))
  },
  // 隐藏某个用户的聊天记录
  deleteChatUser(state, data) {
    // 过滤掉id为data的这个对象
    state.chatUserAll = state.chatUserAll.filter(item => {
      return item != data
    })
    //持久化存储到本地
    uni.setStorageSync('chatUserAll', JSON.stringify(state.chatUserAll))
  },
  // 保存最后一条聊天记录
  saveChatLastHistory(state, obj) {
    // 先找到是否存在于该对象的最后聊天记录
    let lastmsgObj = state.chatLastHistory.find(item => item.id == obj.id)
    // 如果有，就修改最后聊天记录
    if (lastmsgObj) {
      lastmsgObj.msg = obj.msg,
        lastmsgObj.newMsgCount += obj.newMsgCount
    } else {
      // 如果没有就新增最后聊天记录
      state.chatLastHistory.push({
        id: obj.id,
        msg: obj.msg,
        newMsgCount: obj.newMsgCount,
      })
    }
    //持久化保存到本地
    uni.setStorageSync('chatLastHistory', JSON.stringify(state.chatLastHistory))
  },
  // 点击聊天后将消息设置已读
  setChatLastHistory(state, id) {
    // 找到这个聊天对象，将未读消息记录置0
    let lastmsgObj = state.chatLastHistory.find(item => item.id == id)
    lastmsgObj.newMsgCount = 0
    //持久化保存到本地
    uni.setStorageSync('chatLastHistory', JSON.stringify(state.chatLastHistory))
  },
  // 自己发送消息后清除与聊天对象的聊天最后信息，以及未读消息置0
  removeChatLastHistory(state, id) {
    // 找到这个聊天对象
    let lastmsgObj = state.chatLastHistory.find(item => item.id == id)
    let index = state.chatLastHistory.indexOf(lastmsgObj)
    state.chatLastHistory.splice(index, 1)
    //持久化保存到本地
    uni.setStorageSync('chatLastHistory', JSON.stringify(state.chatLastHistory))
  }
}
const actions = {
  async updateSchoolInfo({
    commit
  }) {
    let school = uni.getStorageSync('userSchool')
    let {
      data: res
    } = await updateUserInfo({
      school
    })
    commit('updateSchool')
  },
  //获取用户买到/卖出/发布的商品
  async updateUserShop({
    commit
  }) {
    const data = {
      currentPage: 1,
      pageSize: 1
    }
    let target = {}
    let {
      data: fabu
    } = await getUserfabu(data)
    if (fabu.msg !== 'success') {
      uni.showToast({
        title: fabu.msg,
        icon: "error"
      })
      return
    }
    target['fabu'] = fabu.data.total
    let {
      data: sell
    } = await getUserSell(data)
    if (sell.msg !== 'success') {
      uni.showToast({
        title: sell.msg,
        icon: "error"
      })
      return
    }
    target['sell'] = sell.data.total
    let {
      data: buy
    } = await getUserBuy(data)
    if (buy.msg !== 'success') {
      uni.showToast({
        title: buy.msg,
        icon: "error"
      })
      return
    }
    target['buy'] = buy.data.total
    commit('saveUserShop', target)
  }
}
const getters = {

}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
