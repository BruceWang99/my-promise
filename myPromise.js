
class MyPromise{
	constructor (executor) {
		try{
			executor(this.resovle, this.reject);
		} catch(error) {
			this.reject(error);
		}
	}
	PENDING = 'pending';
    FULFILLED = 'fulfilled';
    REJECTED = 'rejected';
	status = this.PENDING;
	value = undefined;
	reason = undefined; // 这种是什么写法?
	successCallback = [];
	failCallback = [];
	resovle = (value) => { // 这种是什么写法?
		if(this.status !== this.PENDING) return;
		this.status = this.FULFILLED;
		this.value = value;
		while(this.successCallback.length) {
			this.successCallback.shift()()
		}
	}
	reject = (reason) => {
		if(this.status !== this.PENDING) return;
		this.status = this.REJECTED;
		this.reason = reason;
		while(this.failCallback.length) {
			this.failCallback.shift()()
		}
	}
	then(successCallback, failCallback) {
		successCallback = successCallback ?  successCallback : value => value;
		failCallback = failCallback ?  failCallback : value => {throw value};

		let promise2 = new MyPromise((resovle, reject)=>{
			if(this.status === this.FULFILLED) {
				setTimeout(()=>{
					try{
						let x =  successCallback(this.value);
					    this.resovlePromise(promise2, x, resovle, reject);
					} catch(err) {
						reject(err);
					}
				}, 0)
			} else if(this.status === this.REJECTED) {
				setTimeout(()=>{
					try{
						let x = failCallback(this.reason);
					    this.resovlePromise(promise2, x, resovle, reject);
					} catch(err) {
						reject(err);
					}
				}, 0)
			} else {
				this.successCallback.push(()=>{
					setTimeout(()=>{
						try{
							let x =  successCallback(this.value);
							this.resovlePromise(promise2, x, resovle, reject);
						} catch(err) {
							reject(err);
						}
					}, 0)
				});
				this.failCallback.push(()=>{
					setTimeout(()=>{
						try{
							let x = failCallback(this.reason);
							this.resovlePromise(promise2, x, resovle, reject);
						} catch(err) {
							reject(err);
						}
					}, 0)
				});
			}
		})
		return promise2;
	}
	finally (callback){
		return this.then((value)=>{
			return MyPromise.resolve(callback()).then(() => value)
		}, (reason)=>{
			return MyPromise.resolve(callback()).then(() => { throw reason })
		})
	}
	catch (failCallback) {
		return this.then(undefined, failCallback);
	}
	static all(array) {
		let result = [];
		let index = 0;
		return new MyPromise((resolve, reject)=> {
			function saveValue(key, value) {
				result[key] = value;
				index++;
				if(index === array.length) {
					resolve(result)
				}
			}
			array.forEach((element, index) => {
				if(element instanceof MyPromise) {
					element.then((value)=>{
						saveValue(index, value);
					}, reason=> {
						reject(reason)
					})
				} else {
					saveValue(index, element);
				}
			});
		})
	}
	static resolve(value) {
		if(value instanceof MyPromise) {
			return value;
		} else {
			return new MyPromise((resolve)=>{
				resolve(value)
			})
		}
	}
	resovlePromise(promise2, x, resovle, reject) {
		if(promise2 === x) {
			return reject(new TypeError('不能自己调用自己'))
		}
		if(x instanceof MyPromise) {
			x.then(resovle, reject)
		} else {
			resovle(x)
		}
	}
}