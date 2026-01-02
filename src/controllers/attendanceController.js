const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Take class attendance
// @route   POST /api/attendance/class
// @access  Private (Teacher)
const takeClassAttendance = async (req, res) => {
  try {
    const { classId, date, records, notes } = req.body;

    // Check if attendance already exists for this date and class
    const existingAttendance = await Attendance.findOne({
      type: 'class',
      class: classId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: 'Attendance already taken for this class today',
        attendanceId: existingAttendance._id
      });
    }

    const attendance = await Attendance.create({
      date: new Date(date),
      type: 'class',
      class: classId,
      records,
      takenBy: req.user._id,
      notes
    });

    // Send notifications to parents
    await sendAttendanceNotifications(records, 'class', attendance._id);

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('class', 'name')
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Take group attendance
// @route   POST /api/attendance/group
// @access  Private (Teacher)
const takeGroupAttendance = async (req, res) => {
  try {
    const { groupId, date, records, notes } = req.body;

    // Check if attendance already exists for this date and group
    const existingAttendance = await Attendance.findOne({
      type: 'group',
      group: groupId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: 'Attendance already taken for this group today',
        attendanceId: existingAttendance._id
      });
    }

    const attendance = await Attendance.create({
      date: new Date(date),
      type: 'group',
      group: groupId,
      records,
      takenBy: req.user._id,
      notes
    });

    // Send notifications to parents
    await sendAttendanceNotifications(records, 'group', attendance._id);

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('group', 'name')
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Teacher)
const updateAttendance = async (req, res) => {
  try {
    const { records, notes } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { records, notes },
      { new: true }
    )
      .populate('class', 'name')
      .populate('group', 'name')
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('class', 'name')
      .populate('group', 'name')
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo parent');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get class attendance history
// @route   GET /api/attendance/class/:classId
// @access  Private (Teacher/Admin)
const getClassAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = { type: 'class', class: req.params.classId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get group attendance history
// @route   GET /api/attendance/group/:groupId
// @access  Private (Teacher/Admin)
const getGroupAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = { type: 'group', group: req.params.groupId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('takenBy', 'firstName lastName')
      .populate('records.child', 'firstName lastName uniqueId photo')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get child attendance history
// @route   GET /api/attendance/child/:childId
// @access  Private
const getChildAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = { 'records.child': req.params.childId };

    if (type) {
      query.type = type;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .populate('group', 'name')
      .sort({ date: -1 });

    // Extract only this child's records
    const childAttendance = attendance.map(att => {
      const childRecord = att.records.find(
        r => r.child.toString() === req.params.childId
      );
      return {
        _id: att._id,
        date: att.date,
        type: att.type,
        class: att.class,
        group: att.group,
        status: childRecord?.status,
        notes: childRecord?.notes
      };
    });

    res.json(childAttendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance report
// @route   GET /api/attendance/report
// @access  Private (Teacher/Admin)
const getAttendanceReport = async (req, res) => {
  try {
    const { type, classId, groupId, startDate, endDate } = req.query;

    let query = {};

    if (type) query.type = type;
    if (classId) query.class = classId;
    if (groupId) query.group = groupId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .populate('group', 'name')
      .populate('records.child', 'firstName lastName uniqueId')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      totalSessions: attendance.length,
      byStatus: {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      }
    };

    const childStats = {};

    attendance.forEach(att => {
      att.records.forEach(record => {
        stats.byStatus[record.status]++;

        const childId = record.child._id.toString();
        if (!childStats[childId]) {
          childStats[childId] = {
            child: record.child,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0
          };
        }
        childStats[childId][record.status]++;
        childStats[childId].total++;
      });
    });

    // Calculate attendance percentage
    Object.values(childStats).forEach(stat => {
      stat.attendanceRate = stat.total > 0
        ? Math.round(((stat.present + stat.late) / stat.total) * 100)
        : 0;
    });

    res.json({
      summary: stats,
      childrenStats: Object.values(childStats),
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to send attendance notifications
async function sendAttendanceNotifications(records, type, attendanceId) {
  try {
    for (const record of records) {
      const child = await Child.findById(record.child).populate('parent');

      if (child && child.parent) {
        const statusText = record.status === 'present' ? 'marked present'
          : record.status === 'absent' ? 'marked absent'
          : record.status === 'late' ? 'marked late'
          : 'excused';

        await Notification.create({
          recipient: child.parent._id,
          type: 'attendance',
          title: `Attendance Update - ${child.firstName}`,
          message: `${child.firstName} ${child.lastName} was ${statusText} for ${type} today.`,
          relatedChild: child._id,
          relatedAttendance: attendanceId
        });
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

module.exports = {
  takeClassAttendance,
  takeGroupAttendance,
  updateAttendance,
  getAttendanceById,
  getClassAttendanceHistory,
  getGroupAttendanceHistory,
  getChildAttendanceHistory,
  getAttendanceReport
};
