<template>
  <view class="mes">
    <!-- <view class="top">
			<view class="backhome" @click="backhome">
				<image src="../../static/images/back-home.png"></image>
			</view>
			<text>聊天消息</text>
		</view> -->
    <view class="info" v-if="chatUserAll.length">
      <uni-swipe-action>
        <view v-for="(item, i) in chatList" :key="i" class="info1">
          <uni-swipe-action-item :right-options="options" @click="onClick(item.id)">
            <view class="info-item" @click="toChat(item)" v-if="item != 1">
              <view class="left">
                <view class="tx">
                  <image :src="item.image"></image>
                </view>
                <view class="text">
                  <text class="name">{{ item.nickname }}</text>
                  <text class="message">{{ item.lastMsg }}</text>
                </view>
              </view>
              <view class="num" v-if="item.msgCount">
                <text>{{ item.msgCount }}</text>
              </view>
            </view>
          </uni-swipe-action-item>
        </view>
      </uni-swipe-action>
    </view>
    <view class="info-none" v-else>
      消息列表为空<br>快去聊天吧
    </view>
  </view>
</template>

<script>
  import {
    getUserInfoById
  } from "../../network/index.js";
  import {
    mapState,
    mapMutations
  } from "vuex";
  export default {
    data() {
      return {
        chatList: [],
        ws: "",
        count: 0,
        options: [{
          text: '移除',
          style: {
            backgroundColor: '#dd524d'
          }
        },
        // {
        //   text: '取消',
        //   style: {
        //     backgroundColor: '#007aff'
        //   }
        // },
        ]
      };
    },
    computed: {
      ...mapState("user", ["userInfo", "chatUserAll", "chatLastHistory"]),
    },
    onShow() {
      console.log('本地')
      this.chatList = [];
      // console.log("chatUserAll",this.chatUserAll)
      this.getChatList()
    },
    methods: {
      // 获取消息列表
      getChatList(){
        // 遍历每个聊天对象获取聊天对象的头像和名字
        this.chatUserAll.forEach((item, index) => {
          this.chatList[index] = 1
          this.getUserInfoById1(parseInt(item), index);
        });
        // console.log("获取消息列表成功",this.chatList)
      },
      // 对话框左滑
      onClick(id) {
        // console.log(id)
        this.chatList = this.chatList.filter(item => {
          return item.id != id
        })
        //  删除本地存储的记录
        this.deleteChatUser(id)
        // 清除历史存储的与该对象的最后聊天信息
        this.removeChatLastHistory(id)
      },
      ...mapMutations("user", ["saveChatLastHistory", "setChatLastHistory","deleteChatUser","removeChatLastHistory"]),
      backhome() {
        uni.switchTab({
          url: "/pages/home/home",
        });
      },
      toChat(item) {
        item.msgCount = 0;
        this.count = 0
        // 将该对象的未读消息置0
        this.setChatLastHistory(item.id);
        uni.navigateTo({
          url: `/subpkg/chat/chat?sellerId=${item.id}`
        })
      },
      async getUserInfoById1(userId, index) {
        const res = await getUserInfoById({
          userId,
        })
        // console.log("获取信息成功", res.data.data)
        this.chatList.splice(index, 1, res.data.data)
        // console.log("this.chatList", this.chatList)
        // 所有聊天对象信息获取完毕后，再建立连接
        // 获取用户信息成功的对象个数
        this.count += 1
        if (this.count == this.chatUserAll.length) {
          this.socket();
        }
      },
      // 没有新消息使用：查找本地记录的最后一条聊天记录、未读消息条数用于展示
      getLastChatHistory(id) {
        if (this.chatLastHistory.length != 0) {
          let msgobj = this.chatLastHistory.find((item) => {
            return item.id == id;
          });
          return msgobj;
        } else {
          return false;
        }
      },
      // 有新消息时使用：查看是否存在历史新消息并返回
      getNewMsgCount(id) {
        if (this.chatLastHistory.length != 0) {
          let msgobj = this.chatLastHistory.find((item) => {
            return item.id == id;
          });
          return msgobj.newMsgCount;
        } else {
          return 0;
        }
      },
      // 建立与服务器的连接，获取新消息
      socket() {
        let that = this
        const userId = this.userInfo.id;
        this.ws = new WebSocket(`wss://im.yixun.club/websocket/${userId}`);
        //建立连接
        this.ws.onopen = () => {
          console.log("用户" + userId + "连接");
        };

        //接收服务器消息
        this.ws.onmessage = (data) => {
          console.log("接收到新消息：", data.data);
          // 搜集所有消息
          let arr1 = [];
          if (Array.isArray(JSON.parse(data.data))) {
            arr1 = JSON.parse(data.data);
          } else {
            arr1.push(JSON.parse(data.data));
          }
          // 遍历所有聊天对象
          this.chatUserAll.forEach((item1) => {
            let arr2 = [];
            // 遍历所有聊天消息，获取item1这个人的所有发过来的消息
            arr2 = arr1.filter((item2) => {
              return item1 == item2.fromUser;
            });
            // 在请求到的聊天对象信息中查找item1这个人的索引值
            let index = this.chatList.findIndex((item3) => {
              return JSON.stringify(item3.id) == item1;
            });

            // 有新消息
            // 计算消息条数，为该item1这个聊天对象增添num、lastMsg属性
            if (arr2.length != 0) {
              // 展示未读条数时，arr2.length还要加上仓库中存在的未读消息条数
              let AllnewsCount = this.getNewMsgCount(item1) + arr2.length;
              this.$set(this.chatList[index], "msgCount", AllnewsCount);
              this.$set(
                this.chatList[index],
                "lastMsg",
                arr2[arr2.length - 1].msg
              );
              // 计算一下仓库存储的未读消息数需要加几
              // 一条消息时
              let newMsgCount = 1;
              // 多条消息时
              if (arr1.length != 1) {
                newMsgCount = arr2.length;
              }
              let obj = {
                id: parseInt(item1),
                msg: arr2[arr2.length - 1].msg,
                newMsgCount,
              };
              console.log("有新消息，更新仓库的最后一条消息记录、未读消息条数");
              this.saveChatLastHistory(obj);
            } else {
              //没有新消息,则获取历史消息
              // 从本地查找
              let lastmsgObj = this.getLastChatHistory(parseInt(item1));
              if (lastmsgObj) {
                console.log(
                  "与用户" + parseInt(item1) + "的历史最后信息",
                  lastmsgObj.msg
                );
                console.log(lastmsgObj.newMsgCount)
                this.$set(
                  this.chatList[index],
                  "msgCount",
                  lastmsgObj.newMsgCount
                );
                this.$set(this.chatList[index], "lastMsg", lastmsgObj.msg);
              } else {
                // 本地没有
                // 发请求获取最后一条信息记录
                console.log("发请求获取历史消息最后一条消息");
                uni.request({
                  url: "https://im.yixun.club/p2p/querychathistory",
                  data: {
                    user1: this.userInfo.id,
                    user2: parseInt(item1),
                    pagenum: 0,
                  },
                  success: (res) => {
                    let arr3 = res.data.data.list;
                    let lastmsg = arr3[0].msg;
                    if (arr3[0].messageType == "image") {
                      lastmsg = "[图片]"
                    }
                    this.$set(this.chatList[index], "lastMsg", lastmsg);
                    let obj = {
                      id: parseInt(item1),
                      msg: lastmsg,
                      newMsgCount: 0,
                    };
                    this.saveChatLastHistory(obj);
                  },
                });
              }
            }
          });
        };
        //当与服务端连接关闭时触发的事件
        this.ws.onclose = function() {
          //判断是否处于聊天页
          if (window.location.href.indexOf('/subpkg/message/message') != -1) {
            //处于聊天页就自动重连，避免页面退出触发关闭事件自动重连
            console.log('断开连接了，自动重新建立连接')
            //重新建立连接
            that.socket()
          }
        };
        //错误
        this.ws.onerror = (err) => {
          console.log("WebSocket用户建立连接时发生错误11");
        };
      },
    },
    //下拉刷新
    onPullDownRefresh() {
      console.log('本地')
      this.chatList = [];
      this.ws = "",
      this.count = 0,
      this.getChatList()
      uni.stopPullDownRefresh();
    },
    onUnload() {
      console.log("断开连接了");
      if(this.chatUserAll.length != 0){
       this.ws.close(); 
      }
    },
  };
</script>

<style lang="scss">
  .mes {
    .top {
      position: relative;
      padding: 110rpx 30rpx 30rpx;
      text-align: center;

      .backhome {
        position: absolute;
        top: 106rpx;
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background-color: white;
        overflow: hidden;

        image {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 70%;
          height: 70%;
          transform: translateY(-50%) translateX(-50%);
        }
      }
    }

    .info {
      padding: 20rpx;

      .info1{
        margin-bottom: 20rpx;
      }
      .info-item {
        padding: 28rpx 24rpx;
        // margin-bottom: 20rpx;
        background-color: white;
        border-radius: 20rpx;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .left {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .tx {
            width: 80rpx;
            height: 80rpx;
            margin-right: 20rpx;
            overflow: hidden;
            border-radius: 10rpx;

            image {
              width: 100%;
              height: 100%;
            }
          }

          .text {
            display: flex;
            flex-direction: column;
            justify-content: space-around;

            .message {
              height: 42.8rpx;
              display: block;
              max-width: 400rpx;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              color: #cfcfcf;
            }
          }
        }

        .num {
          width: 32rpx;
          height: 32rpx;
          text-align: center;
          line-height: 32rpx;
          background-color: red;
          border-radius: 50%;
          color: white;
          font-size: 24rpx;
          margin-right: 20rpx;
        }
      }
    }
  }
  
  .info-none{
    margin-top: 50px;
    text-align: center;
  }
</style>
