import User from './User.js';
import Category from './Category.js';
import Transaction from './Transaction.js';
import Budget from './Budget.js';

// Define associations
User.hasMany(Category, { foreignKey: 'UserId' });
Category.belongsTo(User, { foreignKey: 'UserId' });

User.hasMany(Transaction, { foreignKey: 'UserId' });
Transaction.belongsTo(User, { foreignKey: 'UserId' });

User.hasMany(Budget, { foreignKey: 'UserId' });
Budget.belongsTo(User, { foreignKey: 'UserId' });

export {
    User,
    Category,
    Transaction,
    Budget
};
