function canJump(nums) {
    let reachable = 0; 
    for (let i = 0; i < nums.length; i++) {
        if (i > reachable) {
            return false;
        }
        reachable = Math.max(reachable, i + nums[i]);
        if (reachable >= nums.length - 1) {
            return true;
        }
    }
    return false;
}

// Example usage:
console.log(canJump([2, 3, 1, 1, 4])); // Output: true
console.log(canJump([3, 2, 1, 0, 4])); // Output: false
