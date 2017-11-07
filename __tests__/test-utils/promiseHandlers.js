export const createPromise = (data, error) => {
    let resolve, reject;
    const promise = new Promise((resolver, rejector) => {
        resolve = () => resolver(data);
        reject = () => rejector(error);
    });

    return {
        resolve,
        reject,
        promise
    };
}
