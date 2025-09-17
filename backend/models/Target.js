import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Target = sequelize.define('Target', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    targetAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    currentAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    targetDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
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
    tableName: 'targets',
    timestamps: true
});

export default Target;
