import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ActionStep = sequelize.define('ActionStep', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    stepNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completedAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    TargetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'targets',
            key: 'id'
        }
    }
}, {
    tableName: 'action_steps',
    timestamps: true
});

export default ActionStep;
