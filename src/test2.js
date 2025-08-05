const myPromise = new Promise((resolve, reject) => {
  const success = true;

  if (success) {
    resolve('Operation was successful!');
  } else {
    reject('Something went wrong.');
  }
});

myPromise
  .then(result => {
    console.log(result); // This will run if the Promise is fulfilled
})
    .catch(error => {
    console.error(error); // This will run if the Promise is rejected
});
