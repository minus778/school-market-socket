<template>
  <view class="chat">
    <uni-popup ref="popup" type="dialog">
      <uni-popup-dialog mode="base" title="撤回这条信息？" :before-close="true" @close="close" @confirm="confirm">
      </uni-popup-dialog>
    </uni-popup>
    <view class="info">
      <block v-for="(item,i) in mesList" :key="i">
        <view class="message-right" v-if="item.type==='right'">
          <view class="mes" v-if="!item.img">
            <view class="text" @longpress="open(item,i)">{{item.info}}</view>
            <view class="sanjiao"></view>
          </view>
          <image @click="previewImg(item.info)" :src="item.info" v-else class="info-img" @longpress="open(item,i)"
            :style="{width:item.width/(item.width/120)+'px',height:item.height/(item.width/120)+'px'}"></image>
          <image :src="userInfo.image" class="tx" @click="gotoSetUser"></image>
        </view>
        <view class="message-left" v-else>
          <image :src="sellerImg" class="tx"></image>
          <view class="mes" v-if="!item.img">
            <view class="text">{{item.info}}</view>
            <view class="sanjiao"></view>
          </view>
          <image @click="previewImg(item.info)" :src="item.info" v-else class="info-img"
            :style="{width:item.width/(item.width/120)+'px',height:item.height/(item.width/120)+'px'}"></image>
        </view>
      </block>
    </view>

    <view class="footer">
      <input placeholder="请输入内容" v-model="message" @keydown.enter="submitMes"/>
      <uni-icons custom-prefix="custom-icon" type="image-filled" size="30" class="icons" @click="chooseImg"></uni-icons>
      <text @click="submitMes">发送</text>
    </view>
  </view>
</template>

<!-- <script>
	import {mapState} from 'vuex'
	export default {
		data() {
			return {
				//SDK实例
				tim:null,
				//卖家id，为了传达聊天信息
				sellerId:null,
				mesList:[],
				message:'',
				nextReqMessageID:null,
				isCompleted:false,
				sellerImg:"",
				sellerName:""
			};
		},
		computed:{
			//this.userInfo.id获取当前用户id
			...mapState('user',['userInfo'])
		},
		onLoad(options){
			this.sellerId = options.sellerId
			//创建SDK实例
			let tim = this.$TIM.create({SDKAppID: this.$SDKAppID});
			this.tim = tim
			//获取对方资料
			this.getUserInfo()
			//初始化时获取聊天信息列表
			this.getMesList()
			
			//监听消息接收
			this.tim.on(this.$TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived);
		},
		//页面卸载
		onUnload(){
			// 将当前会话下所有未读消息已读上报
			this.tim.setMessageRead({conversationID: `C2C${this.sellerId}`});
		},
		methods:{
			//获取用户资料
			getUserInfo(){
				let promise = this.tim.getUserProfile({
				  userIDList: [this.sellerId] // 请注意：即使只拉取一个用户的资料，也需要用数组类型，例如：userIDList: ['user1']
				});
				promise.then((imResponse)=>{
				  console.log('卖家信息',imResponse.data); // 存储用户资料的数组 - [Profile]
				  this.sellerImg = imResponse.data[0].avatar
				  this.sellerName = imResponse.data[0].nick
				  //修改标题
				  uni.setNavigationBarTitle({
				    title: this.sellerName
				  })
				}).catch((imError)=>{
				  console.warn('getUserProfile error:', imError); // 获取其他用户资料失败的相关信息
				});
			},
			//发图片
			chooseImg(){
				// 小程序端发送图片
				// 1. 选择图片
				const that = this
				uni.chooseImage({
				  sourceType: ['album'], // 从相册选择
				  count: 1, // 只选一张，目前 SDK 不支持一次发送多张图片
				  success: function (res) {
				    // 2. 创建消息实例，接口返回的实例可以上屏
				    let message = that.tim.createImageMessage({
				      to: that.sellerId,
				      conversationType: that.$TIM.TYPES.CONV_C2C,
				      payload: { file: res },
				      onProgress: (event)=>{ console.log('file uploading:', event) }
				    });
				    // 3. 发送图片
				    let promise = that.tim.sendMessage(message);
				    promise.then((imResponse)=>{
				      // 发送成功
					  //滚动到底部
					  setTimeout(() => {
					     uni.pageScrollTo({scrollTop: 99999, duration: 0});
					  }, 50);
				      console.log(imResponse);
					  const data = imResponse.data.message
					  const item = {
						  info:data.payload.imageInfoArray[1].url,
						  type:'right',
						  img:true,
						  width:data.payload.imageInfoArray[1].width,
						  height:data.payload.imageInfoArray[1].height,
					  }
					  that.mesList.push(item)
				    }).catch((imError)=>{
				      // 发送失败
				      console.warn('sendMessage error:', imError);
				    });
				  }
				})
			},
			//发消息
			submitMes(){
				// 发送文本消息，Web 端与小程序端相同
				// 1. 创建消息实例，接口返回的实例可以上屏
				let message = this.tim.createTextMessage({
				  to: this.sellerId,
				  conversationType: this.$TIM.TYPES.CONV_C2C,
				  payload: {
				    text: this.message
				  }
				});
				// 2. 发送消息
				let promise = this.tim.sendMessage(message,{
				  // 如果接收方不在线，则消息将存入漫游，且进行离线推送（在接收方 App 退后台或者进程被 kill 的情况下）。接入侧可自定义离线推送的标题及内容
				  offlinePushInfo: {
					title: '您有一条信息未查看', // 离线推送标题
					description: '您有一条信息待查看', // 离线推送内容
				  }
				});
				promise.then((imResponse)=>{
				  // 发送成功
				  //滚动到底部
				  setTimeout(() => {
				     uni.pageScrollTo({scrollTop: 99999, duration: 0});
				  }, 50);
				  this.message = ''
				  console.log('发送成功',imResponse);
				  const data = imResponse.data.message
				  const item = {
					  info:data.payload.text,
					  type:'right'
				  }
				  this.mesList.push(item)
				}).catch((imError)=>{
				  // 发送失败
				  console.warn('sendMessage error:', imError);
				});
			},
			//接收消息(监听消息接收)
			onMessageReceived(event){
				console.log('接收到消息',event.data)
				//滚动到底部
				setTimeout(() => {
				   uni.pageScrollTo({scrollTop: 99999, duration: 0});
				}, 50);
				event.data.forEach((item)=>{
					//接收文字消息
					if(item.payload.text){
						this.mesList.push({
							info:item.payload.text,
							type:"left",
						})
					}
					//接收图片消息
					if(item.payload.imageInfoArray){
						this.mesList.push({
							info:item.payload.imageInfoArray[1].url,
							type:'left',
							img:true,
							width:item.payload.imageInfoArray[1].width,
							height:item.payload.imageInfoArray[1].height,
						})
					}
				})
			},
			//获取当前会话的消息列表
			getMesList(fn){
				// 获取聊天信息
				let promises = this.tim.getMessageList({
					conversationID: 'C2C' + this.sellerId,
					nextReqMessageID: this.nextReqMessageID,
					count: 15
				});
				promises.then((imResponse) => {
					console.log(imResponse)
					let list = []
					imResponse.data.messageList.forEach((item)=>{
						//文字消息
						if(item.payload.text){
							if(item.from===String(this.userInfo.id)){
								list.push({
									info:item.payload.text,
									type:"right",
								})
							}else{
								list.push({
									info:item.payload.text,
									type:"left",
								})
							}
						}
						//图片消息
						if(item.payload.imageInfoArray){
							if(item.from===String(this.userInfo.id)){
								list.push({
									info:item.payload.imageInfoArray[1].url,
									type:'right',
									img:true,
									width:item.payload.imageInfoArray[1].width,
									height:item.payload.imageInfoArray[1].height,
								})
							}else{
								list.push({
									info:item.payload.imageInfoArray[1].url,
									type:'left',
									img:true,
									width:item.payload.imageInfoArray[1].width,
									height:item.payload.imageInfoArray[1].height,
								})
							}
						}
					})
					this.mesList = list.concat(this.mesList)
					//滚动到底部
					if(!fn){
						setTimeout(() => {
						   uni.pageScrollTo({scrollTop: 99999, duration: 0});
						}, 50);
					}
					this.nextReqMessageID = imResponse.data.nextReqMessageID; // 用于续拉，分页续拉时需传入该字段
					console.log('nextReqMessageID', this.nextReqMessageID)
					this.isCompleted = imResponse.data.isCompleted; // 表示是否已经拉完所有消息。
					console.log('是否已经拉完所有消息', this.isCompleted)
					//结束下拉刷新
					fn&&fn()
				})
			}
		},
		//下拉加载更多聊天信息
		onPullDownRefresh() {
		  //重新发请求获取商品数据
		  if(!this.isCompleted){
			this.getMesList(uni.stopPullDownRefresh)
		  }else{
			uni.showToast({
				title:"没有更多历史消息了~",
				icon:"none"
			})
			uni.stopPullDownRefresh()
		  }
		  
		},
	}
</script> -->
<script>
  import {
    mapState,
    mapMutations
  } from 'vuex'
  import {
    getUserInfoById
  } from '../../network/index.js'
  export default {
    data() {
      return {
        //卖家id，为了传达聊天信息
        sellerId: null,
        mesList: [],
        imgList: [],
        message: '',
        sellerImg: "",
        sellerName: "",
        ws: null,
        pageNum: 1,
        pageTotal: null,
        deleteMsgId: null, // 撤回的消息id
        myMsg: {} ,// 我发出的消息
      };
    },
    computed: {
      //this.userInfo.id获取当前用户id
      ...mapState('user', ['userInfo']),
    },
    onLoad(options) {
      //注册了的用户在断开连接之后才能保存未读消息和聊天记录，没有注册的用户只能建立临时通信，但凡一方断开连接，则发送的消息都不能保存在聊天记录，而且不能收到未读消息
      this.sellerId = options.sellerId
      //获取对方资料
      this.getsellInfo()

      //初始化时获取聊天信息列表(聊天记录)
      this.getMesList(this.scrollTBootom)

      //socket
      this.socket()

    },
    //页面卸载
    onUnload() {
      console.log('页面退出，关闭连接')
      //关闭连接
      this.ws.close()
    },
    methods: {
      gotoSetUser(){
        uni.navigateTo({
          url: "/subpkg/setUser/setUser",
      });
      },
      date(time) {
        console.log(time)
        // 获取当前时间戳
        let curTime1 = new Date().getTime()
        // 将消息发送的时间加两分钟转换为时间戳
        // 消息发送的时间
        let curTime = new Date(time)
        // 加两分钟转换为时间戳
        let curTime2 = new Date(curTime.setMinutes(curTime.getMinutes() + 2)).getTime();
        // console.log(curTime1, curTime, curTime2)
        return curTime1 < curTime2
      },
      // 滚动到底部
      scrollTBootom(){
        //滚动到底部
        setTimeout(() => {
          uni.pageScrollTo({
            scrollTop: 99999,
            duration: 0
          });
        }, 50);
      },
      // 由消息id撤回某条信息
      async open(item,i) {
        console.log("lenght",this.mesList.length)
        console.log(i)
        
        this.deleteMsgId = item.id
        console.log(item.id)
        
        if(!item.createTime) return
        if (this.date(item.createTime)) {
          this.$refs.popup.open()
        } else {
          uni.showToast({
            title: "超出2分钟的消息不支持撤回哦~",
            icon: "none"
          })
        }
      },
      close() {
        this.$refs.popup.close()
      },
      confirm() {
        this.deleteMsg()
        this.$refs.popup.close()
      },
      deleteMsg() {
        let that = this
        uni.request({
          url: `https://im.yixun.club/p2p/delete/${that.deleteMsgId}`,
          method: "POST",
          header: {
            'Content-Type': 'application/x-www-form-urlencoded' //自定义请求头信息
          },
          success: (data) => {
            console.log("撤回成功！")
            that.mesList = that.mesList.filter(item => {
              return item.id != that.deleteMsgId
            })
            // 清除历史存储的与该对象的最后聊天信息
            that.removeChatLastHistory(that.sellerId)
            that.$refs.popup.close()
          }
        })
      },
      ...mapMutations('user', ['removeChatLastHistory']),
      //预览图片
      previewImg(src) {
        uni.previewImage({
          urls: this.imgList,
          current: this.imgList.indexOf(src),
          indicator: "number"
        })
      },
      //获取自己发出信息、图片的id
      async getMyMesId(i,...arg) {
        await uni.request({
          url: "https://im.yixun.club/p2p/querychathistory",
          method: "GET",
          data: {
            user1: this.userInfo.id,
            user2: this.sellerId,
            pagenum: 1,
          },
          success: (data) => {
            // console.log('聊天记录：', data.data)
            //聊天记录信息
            let list = data.data.data.list
            // 待撤回的消息是
            const obj =  list[this.mesList.length - i -1]
            // 发请求得到id和createTime，将他们修改到刚发出的消息中
            if(obj.messageType == "text"){
              this.mesList.splice(i,1,{
                info: obj.msg,
                type: "right",
                id: obj.id,
                createTime: obj.createTime
              })
            }else{
              this.mesList.splice(i,1,{
                info: obj.msg,
                type: "right",
                img:true,
                width:arg[0],
                height:arg[1],
                id: obj.id,
                createTime: obj.createTime
              })
            }
              
            this.deleteMsgId = obj.id
            console.log(this.deleteMsgId)
          }
        })
      },
      //获取聊天记录
      getMesList(fn) {
        uni.request({
          url: "https://im.yixun.club/p2p/querychathistory",
          method: "GET",
          data: {
            user1: this.userInfo.id,
            user2: this.sellerId,
            pagenum: this.pageNum
          },
          success: (data) => {

            // console.log('聊天记录：', data.data)
            //记录聊天记录总页数
            this.pageTotal = data.data.data.totalPage
            //聊天记录信息
            let list = data.data.data.list
            console.log(list)
            //vue方法-实例化一个图片实例供后面获取图片宽高
            const img = new Image()
            list.forEach((item) => {
              let fx = item.fromUser === JSON.stringify(this.userInfo.id) ? 'right' : 'left'
              //文字消息
              if (item.messageType === 'text') {
                this.mesList.unshift({
                  info: item.msg,
                  type: fx,
                  id: item.id,
                  createTime: item.createTime
                })
              }
              //图片消息
              if (item.messageType === 'image') {
                // //获取图片大小
                uni.getImageInfo({
                  src:item.msg,
                  success:(res)=>{
                	  console.log('然后获取到图片宽高信息：',res)
                    // 找到目标 加上宽高信息
                    const obj = this.mesList.find(v=>v.id === item.id)
                    this.$set(obj,"width",res.width)
                    this.$set(obj,"height",res.height)
                    this.scrollTBootom()
                	}
                })
                //图片添加到聊天信息中
                const image = {
                  id: item.id,
                  info:item.msg,
                  type:fx,
                  img:true,
                  createTime: item.createTime
                }
                console.log('图片先添加到展示数组里了')
                this.mesList.unshift(image)
                this.imgList.unshift(item.msg)
                
                
                //图片添加到聊天信息中
                //将图片src赋值给image实例，通过width和height获取宽高
                // img.src = item.msg
                // console.log(img)
                // console.log('宽：', img.width, '高：', img.height)
                // const image = {
                //   info: item.msg,
                //   id: item.id,
                //   createTime: item.createTime,
                //   type: fx,
                //   img: true,
                //   width: img.width,
                //   height: img.height,
                // }
                // this.mesList.unshift(image)
                // this.imgList.unshift(item.msg)
                
              }
            })
            //停止下拉刷新
            fn && fn()
          }
        })
      },
      //获取卖家用户信息
      async getsellInfo() {
        let res = await getUserInfoById({
          userId: this.sellerId
        })
        console.log('卖家信息：', res)
        this.sellerImg = res.data.data.image
        this.sellerName = res.data.data.nickname
        //修改标题
        uni.setNavigationBarTitle({
          title: this.sellerName
        })
      },
      //发文字消息
      async submitMes() {
        if (/^ *$/.test(this.message)) {
          uni.showToast({
            title: '请输入内容再发送',
            icon: 'error'
          })
          this.message = ''
          return
        }
                 //自己发的文字消息添加进去
                        this.mesList.push({
                          info: this.message,
                          type: "right",
                        })
        let mes = {
          "toUser": this.sellerId,
          "fromUser": JSON.stringify(this.userInfo.id),
          "messageType": "text",
          "msg": this.message,
        }
        console.log(mes)
        // console.log(this.ws.send(JSON.stringify(mes)))
        await this.ws.send(JSON.stringify(mes))
        this.message = ''
        
        // 500毫秒后，发请求获取历史聊天记录里面的id和createTime
        setTimeout(()=>{
          this.getMyMesId(this.mesList.length - 1)
        },500)
        
        // 清除历史存储的与该对象的最后聊天信息
        this.removeChatLastHistory(this.sellerId)
        //滚动到底部
        setTimeout(() => {
          uni.pageScrollTo({
            scrollTop: 99999,
            duration: 0
          });
        }, 50);
      },
      //发图片消息
      chooseImg() {
        //回调函数的箭头指向问题导致回调函数的this指向的不是vue组件，定义that将组件的this保存下来
        const that = this;
        //从本地选择图片
        uni.chooseImage({
          count: 1,
          success(res) {
            uni.showLoading({
              title: "图片发送中~",
            })
            const images = res.tempFilePaths;
            //图片选择完成,发请求将图片上传到服务器
            images.forEach((image) => {
            uni.uploadFile({
                url: "https://mfxy.tanghaolun.cn/api/v1/common/upload",
                filePath: image,
                name: "file",
                timeout: 7000,
                formData: {
                  type: 1,
                  img_type: "dynamic",
                },
                fail() {
                  uni.hideLoading()
                  uni.showToast({
                    title: '发送失败',
                    icon: "error",
                  });
                },
                success(mes) {
                  uni.hideLoading()
                  console.log('返回图片', mes)
                  if (mes.statusCode === 200) {
                    const data = JSON.parse(mes.data);
                    //图片上传出错
                    if (data.errNo != 0) {
                      uni.showToast({
                        title: data.errstr,
                        icon: "error",
                      });
                      return;
                    }

                    //获取图片大小
                    uni.getImageInfo({
                      src: data.data,
                      success: (res) => {
                        console.log('图片信息：', res)
        
                        // 先将图片信息添加进mesList数组里，撤回消息的时候再去发请求获取id，或者再次进入聊天页面获取历史消息时可以获取id，这样用户无感
                        const item = {
                          info: data.data,
                          type: 'right',
                          img: true,
                          width: res.width,
                          height: res.height,
                        }
                        that.mesList.push(item)
                        that.imgList.push(item.info)
                        
                        // console.log(that.mesList)
                        
                        // 清除历史存储的与该对象的最后聊天信息
                        that.removeChatLastHistory(that.sellerId)
                        //滚动到底部
                        setTimeout(() => {
                          uni.pageScrollTo({
                            scrollTop: 99999,
                            duration: 0
                          });
                        }, 50);
                        //图片上传成功返回图片，将图片url发到服务器
                        const message = {
                          "toUser": that.sellerId,
                          "fromUser": JSON.stringify(that.userInfo.id),
                          "messageType": "image",
                          "msg": data.data
                        }

                        that.ws.send(JSON.stringify(message))
                        // 500毫秒后，发请求获取历史聊天记录里面的id和createTime
                        setTimeout(()=>{
                          that.getMyMesId(that.mesList.length - 1,res.width,res.height)
                        },500)
                      }
                    })

                  }
                  else if(mes.statusCode === 413) {
                    uni.showToast({
                      title: '图片大小超过限制，发送失败',
                      icon: "error",
                    });
                  } else {
                    console.log("发送成功")
                    // 发送成功
                    // 清除历史存储的与该对象的最后聊天信息
                    that.removeChatLastHistory(that.sellerId)
                  }
                },
              });
            });
          },
        });
      },
      //socket连接
      socket() {
      //socket连接
      this.ws = new WebSocket(`wss://im.yixun.club/websocket/${this.userInfo.id}`)
    
      //建立连接
      this.ws.onopen = () => {
        // console.log(`用户${this.userInfo.id}已连接`);
      }
      //监听断开连接
      this.ws.onclose = () => {
        //判断是否处于聊天页
        if (window.location.href.indexOf('subpkg/chat/chat?sellerId=') != -1) {
          //处于聊天页就自动重连，避免页面退出触发关闭事件自动重连
          console.log('断开连接，自动重新建立连接')
          //重新建立连接
          this.socket()
        }
      }
      //接收服务器消息
      this.ws.onmessage = (data) => {
        const mes = JSON.parse(data.data)
        if(mes.length == 0) return
        console.log('接收到消息：', mes);
        console.log('消息是否来自当前聊天对象：', mes.fromUser === this.sellerId)
        //判断接收的消息是否是当前正在聊天的用户发过来的
        //文字消息
        if (mes.fromUser === this.sellerId && mes.messageType === "text") {
          this.mesList.push({
            info: mes.msg,
            type: "left",
            id: mes.id,
            createTime: mes.createTime
          })
        }
        //图片消息
        else if (mes.fromUser === this.sellerId && mes.messageType === 'image') {
          //获取图片大小
          uni.getImageInfo({
            src: mes.msg,
            success: (res) => {
              console.log('图片信息：', res)
              //图片添加到聊天信息中
              const image = {
                info: mes.msg,
                id: mes.id,
                createTime: mes.createTime,
                type: 'left',
                img: true,
                width: res.width,
                height: res.height,
              }
              this.mesList.push(image)
              this.imgList.push(mes.msg)
            }
          })
        }
        
        // 清除历史存储的与该对象的最后聊天信息
        this.removeChatLastHistory(this.sellerId)
        //滚动到底部
        setTimeout(() => {
          uni.pageScrollTo({
            scrollTop: 99999,
            duration: 0
          });
        }, 50);
      }
      //错误
      this.ws.onerror = (err) => {
        console.log(err);
      }
    
    },
    },
    //下拉加载更多聊天信息
    onPullDownRefresh() {
      //重新发请求获取商品数据
      if (this.pageNum < this.pageTotal) {
        this.pageNum++
        this.getMesList(uni.stopPullDownRefresh)
      } else {
        uni.showToast({
          title: "没有更多历史消息了~",
          icon: "none"
        })
        uni.stopPullDownRefresh()
      }
    },
    
  }
</script>

<style lang="scss">
  .chat {
    .info {
      padding-bottom: 120rpx;

      .message-right {
        display: flex;
        justify-content: flex-end;
        margin: 20rpx;

        .tx {
          width: 80rpx;
          height: 80rpx;
          border-radius: 10rpx;
          overflow: hidden;
        }

        .info-img {
          border-radius: 10rpx;
          overflow: hidden;
          margin-right: 20rpx;
        }

        .mes {
          position: relative;
          margin-right: 30rpx;

          .sanjiao {
            position: absolute;
            right: -18rpx;
            top: 30rpx;
            width: 0;
            height: 0;
            line-height: 0;
            font-size: 0;
            border: 10rpx solid transparent;
            border-left-color: #42b983;
          }

          .text {
            word-wrap: break-word;
            padding: 20rpx;
            background-color: #42b983;
            border-radius: 10rpx;
            color: white;
            max-width: 360rpx;
          }
        }
      }

      .message-left {
        display: flex;
        margin: 20rpx;

        .tx {
          width: 80rpx;
          height: 80rpx;
          border-radius: 10rpx;
          overflow: hidden;
        }

        .info-img {
          border-radius: 10rpx;
          overflow: hidden;
          margin-left: 20rpx;
        }

        .mes {
          position: relative;
          margin-left: 30rpx;

          .sanjiao {
            position: absolute;
            left: -18rpx;
            top: 30rpx;
            width: 0;
            height: 0;
            line-height: 0;
            font-size: 0;
            border: 10rpx solid transparent;
            border-right-color: #FFFFFF;
          }

          .text {
            word-wrap: break-word;
            padding: 20rpx;
            background-color: #FFFFFF;
            border-radius: 10rpx;
            max-width: 360rpx;
          }
        }

      }
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 20rpx;
      background-color: #efefef;

      input {
        padding: 16rpx 10rpx;
        border-radius: 8rpx;
        background-color: white;
        width: 74%;
      }

      .icons {
        margin: 0 6rpx;
      }

      text {
        font-size: 30rpx;
      }
    }
  }
</style>
