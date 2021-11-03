/*
尽可能还原 Promise 中的每一个 API, 并通过注释的方式描述思路和原理.
1、Promise基础部分, 是一个类, new 这个类的时候, 传一个立即执行的函数, 函数有两个参数, 一个resolve
一个reject, 这两个参数是Promise类里面的两个方法
2、Promise实例上的函数表达式resolve: 把Promise的状态从pending=>fulfilled
3、Promise实例上的函数表达式reject: 把Promise的状态从pending=>rejected, 状态的转化是不可逆转的
4、Promise.prototype.then方法: 是Promise的回调函数, 有两个参数接收回调函数的传过来的值, 第一个是resolved成功后的回调, 第二个是rejected失败之后的回调, then方法返回的是一个Promise对象,可以链式调用then方法 (1、回调函数返回值是一个Promise的情况, 2、不是Promise的情况)
5、Promise.prototype.catch: then方法, 失败回调的那部分
6、Promise.prototype.finally: 不过成功还是失败, 都会走这个函数, 且返回一个Promise, 后面链式调用then\catch
7、静态方法Promise.resolve(): new 一个状态是resolved的Promise对象
8、静态方法Promise.reject(): new 一个状态是rejected的Promise对象
9、静态方法Promise.all(): 参数是一个装有Promise的数组, 返回值是所有Promise回调的结果, 且按照数组的顺序, 返回回调的结果
10、静态方法Promise.race(): 参数是一个装有Promise的数组, 有一个Promise成功, 就返回成功回调, 所有的Promise失败才返回失败回调
*/
class MyPromise{
	constructor(excutor) {
		try { // 处理异常
			excutor(this.resolve, this.reject)
		} catch(err) {
			this.reject(err)
		}
	}
	// 仅在实例上的属性, 表示Promise的状态 等价于在构造函数中写this.status = status, 这是ES7的写法
	status = 'pending'
	// 存储回调函数里的值, 私有变量_value
	_value = undefined
	callbackQueue = [] // 回调函数有传的值的队列
	// 仅在实例上的函数表达式resolve 等价于在构造函数中写this.resolve = function (params) {}, 这是ES7的写法  //TODO 这里留一个疑问, 如果这里不用箭头函数, this为什么是undefined?
	resolve = (value) => {
		// console.log('this',this);
		if(this.status !== 'pending') return;
		this.status = 'fulfilled'
		this._value = value
		let queueItem = this.callbackQueue.shift();
		queueItem && queueItem['successCallback']();
	}
	// 仅在实例上的函数表达式reject 等价于在构造函数中写this.resolve = function (params) {}, 这是ES7的写法
	reject =  (value) => {
		if(this.status !== 'pending') return;
		this.status = 'rejected';
		this._value = value;
		let queueItem = this.callbackQueue.shift();
		queueItem && queueItem['failCallback']();
	}
	// 解析promise的私有方法, 处理回调函数返回值: 1、是一个Promise的情况, 2、不是Promise的情况
	_resolvePromise(r, resolve, reject){
		if(r instanceof MyPromise) {
			r.then(resolve, reject)
		} else {
			resolve(r)
		}
	}
    // Promise.prototype.then,这个是Promise的精髓, 这个搞清楚了, Promise 就理解了
	then(successCallback,  failCallback) {
		// 兼容 successCallback、failCallback为空的情况
		successCallback = successCallback ? successCallback : (value) => value;
		failCallback = failCallback ? failCallback : (value) => { throw value }; // 这个错误一定要throw抛出, 不然就走到了resolve里面了
	    // 返回的一个promise
		return new MyPromise((resolve, reject) =>{
			if(this.status === 'fulfilled') {
				setTimeout(()=>{ // 解决回调函数里面的异步顺序问题
					try { // 处理异常
						const r = successCallback(this._value);
						this._resolvePromise(r, resolve, reject);
					} catch(err) {
						reject(err)
					}
				},0)
			} else if (this.status === 'rejected') {
				setTimeout(()=>{ // 解决回调函数里面的异步顺序问题
					try { // 处理异常
						const r = failCallback(this._value)
						this._resolvePromise(r, resolve, reject);
					} catch(err) {
						reject(err)
					}
				},0)
			} else { // 兼容new Promise时候, 执行函数异步执行的情况
				this.callbackQueue.push({successCallback: ()=>{
					setTimeout(()=>{ // 解决回调函数里面的异步顺序问题
						try { // 处理异常
							const r = successCallback(this._value);
							this._resolvePromise(r, resolve, reject);
						} catch(err) {
							reject(err)
						}
					},0)
				}, failCallback:()=>{
					setTimeout(()=>{  // 解决回调函数里面的异步顺序问题
						try { // 处理异常
							const r = failCallback(this._value)
							this._resolvePromise(r, resolve, reject);
						} catch(err) {
							reject(err)
						}
					},0)
				}});
			}
		});
	}
    // Promise.prototype.catch: then方法, 失败回调的那部分
	catch(failCallback) {
		return this.then(null, failCallback);
	}
	// Promise.prototype.finally: 不过成功还是失败, 都会走这个函数, 且返回一个Promise, 后面链式调用then\catch
	finally(fn) {
		return this.then(() => {
			fn(this._value);
			return this._value;
		}, ()=>{
			fn(this._value);
			throw this._value;
		});
	}
	// 静态方法Promise.resolve(): new 一个状态是resolved的Promise对象 1、是Promise对象直接返回2、不是Promise对象, 就new一个状态是resolved的Promise对象 3、是一个有then方法的对象,就把这个对象转化为Promise对象
	static resolve(param) {
		if(param instanceof MyPromise) {
			return param;
		} else if (param instanceof Object && param.then) { // 是一个有then方法的对象,就把这个对象转化为Promise对象
			return new MyPromise(param.then)
		} else {
			return new MyPromise((resolve)=>{
				resolve(param)
			})
		}
	}
	// 静态方法Promise.reject(): new 一个状态是rejected的Promise对象, 参数会原封不动(和Promise.resolve()不一样)
	static reject(param) {
		return new MyPromise((resolve, reject)=>{
			reject(param)
		})
	}
	// 静态方法Promise.all(): 参数是一个装有Promise的数组, 返回值是所有Promise回调的结果, 且按照数组的顺序, 返回回调的结果
	static all(arr){
		let result = [];
		let count = 0;
		return new MyPromise((resolve, reject)=>{
			for (let i = 0; i < arr.length; i++) {
				if(arr[i] instanceof MyPromise) {
					arr[i].finally((res)=>{
						result[i] = res;
					}).then(()=>{
						count++;
						if(count === arr.length) {
							resolve(result)
						}
					}, err=>{
						console.log('rejectrejectreject');
						reject(err);
					})
				} else {
					result[i] = arr[i];
					count++;
				}			
			}
		})
		
	}
	// 静态方法Promise.race(): 参数是一个装有Promise的数组, 有一个Promise成功, 就返回成功回调, 所有的Promise失败才返回失败回调
	static race(arr){
		return new MyPromise((resolve, reject)=>{
			for (let i = 0; i < arr.length; i++) {
				let item = null;
				if(arr[i] instanceof MyPromise) {
					item = arr[i]
				} else {
					item = MyPromise.resolve(arr[i])
				}
				item.then((res)=>{
					resolve(res);
				}, err=>{
					reject(err);
				})		
			}
		})
		
	}
}
module.exports = MyPromise;
