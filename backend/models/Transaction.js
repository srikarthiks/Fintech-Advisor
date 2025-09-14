import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'transactions',
    timestamps: true
});

export default Transaction;
