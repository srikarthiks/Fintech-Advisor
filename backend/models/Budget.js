import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Budget = sequelize.define('Budget', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    month: {
        type: DataTypes.STRING(7), // Format: "2024-01"
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
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
    tableName: 'budgets',
    timestamps: true
});

export default Budget;