import Tutions from "../models/Tutions.js";
import User from "../models/User.js";
import mongoose from "mongoose";


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .lean();

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findByIdAndDelete(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};








export const getTuitions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      tuitionType,
      grade,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filter = {};


    if (
      status &&
      status !== "all" &&
      status !== "undefined" &&
      status !== ""
    ) {
      filter.status = status;
    }


    if (
      tuitionType &&
      tuitionType !== "all" &&
      tuitionType !== "undefined" &&
      tuitionType !== ""
    ) {
      filter.tuitionType = tuitionType;
    }

 
    if (
      grade &&
      grade !== "all" &&
      grade !== "undefined" &&
      grade !== ""
    ) {
      filter.grade = grade;
    }

 
    if (search && search.trim()) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { "location.city": new RegExp(search, "i") },
        { "location.area": new RegExp(search, "i") }
      ];
    }


    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

  
    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1
    };

  
    const [tuitions, total] = await Promise.all([
      Tutions.find(filter)
        .populate("postedBy", "name email avatarUrl phone")
        .populate("guardianPosted", "name email avatarUrl phone")
        .populate("assignedTutor", "name email avatarUrl")
        .sort(sort)
        .skip(skip)
        .limit(pageSize),

      Tutions.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: tuitions,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
   

  } catch (error) {
    console.error("Fetch tuitions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tuitions"
    });
  }
};



export const approveTuition = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const tuition = await Tutions.findById(id);
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
    }

    
    if (tuition.status !== "pending_approval") {
      return res.status(400).json({
        success: false,
        message: `Tuition is already ${tuition.status}`
      });
    }


    tuition.status = "open";
    tuition.adminApprovalStatus='approved'
    
 
    tuition.statusHistory.push({
      status: "open",
      changedBy: adminId,
      changedAt: new Date(),
      reason: "Approved by admin"
    });

    await tuition.save();

   
    const updatedTuition = await Tutions.findById(id)
      .populate("postedBy", "name email avatarUrl")
      .populate("guardianPosted", "name email avatarUrl");

    res.status(200).json({
      success: true,
      message: "Tuition approved successfully",
      data: updatedTuition
    });
  } catch (error) {
    console.error("Error approving tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve tuition",
      error: error.message
    });
  }
};


export const rejectTuition = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const tuition = await Tutions.findById(id);
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
    }

 
    tuition.status = "cancelled";
     tuition.adminApprovalStatus='rejected'
    
  
    tuition.statusHistory.push({
      status: "cancelled",
      changedBy: adminId,
      changedAt: new Date(),
      reason: reason
    });

    await tuition.save();

    res.status(200).json({
      success: true,
      message: "Tuition rejected successfully",
      data: tuition
    });
  } catch (error) {
    console.error("Error rejecting tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject tuition",
      error: error.message
    });
  }
};


export const updateTuitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user._id;

    const tuition = await Tutions.findById(id);
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
    }


    const validStatuses = [
      "open",
      "assigned",
      "in-progress",
      "completed",
      "cancelled"
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    
    const oldStatus = tuition.status;
    tuition.status = status;
    
 
    tuition.statusHistory.push({
      status: status,
      changedBy: adminId,
      changedAt: new Date(),
      reason: reason || `Status changed from ${oldStatus} to ${status} by admin`
    });

    await tuition.save();

    res.status(200).json({
      success: true,
      message: "Tuition status updated successfully",
      data: tuition
    });
  } catch (error) {
    console.error("Error updating tuition status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tuition status",
      error: error.message
    });
  }
};


export const getTuitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const tuition = await Tutions.findById(id)
      .populate("postedBy", "name email avatarUrl phone studentProfile")
      .populate("guardianPosted", "name email avatarUrl phone guardianProfile")
      .populate("assignedTutor", "name email avatarUrl tutorProfile")
      .populate({
        path: "applications.tutor",
        select: "name email avatarUrl tutorProfile",
        populate: {
          path: "tutorProfile",
          select: "subjects experienceYears rating"
        }
      });

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
    }

    res.status(200).json({
      success: true,
      data: tuition
    });
  } catch (error) {
    console.error("Error fetching tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tuition",
      error: error.message
    });
  }
};


export const deleteTuition = async (req, res) => {
  try {
    const { id } = req.params;

    const tuition = await Tutions.findByIdAndDelete(id);

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: "Tuition not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Tuition deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting tuition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tuition",
      error: error.message
    });
  }
};





export const getSimpleRevenue = async (req, res) => {
  console.log( 'i am calling 1')
  try {
 
    const paidTuitions = await Tutions.find({
      paymentStatus: 'paid',
      paymentIntentId: { $exists: true, $ne: null }
    });

  
    const totalRevenue = paidTuitions.reduce((sum, tuition) => sum + tuition.totalFee, 0);
    
    
    const platformEarnings = totalRevenue * 0.1;
    

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    
    const lastMonthRevenue = await Tutions.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paymentIntentId: { $exists: true, $ne: null },
          paidAt: {
            $gte: lastMonth,
            $lt: now
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalFee" }
        }
      }
    ]);
    
    const previousMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const growth = previousMonthRevenue > 0 
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 100;

 
    const recentTransactions = await Tutions.find({
      paymentStatus: 'paid',
      paymentIntentId: { $exists: true, $ne: null }
    })
      .populate('postedBy', 'name email')
      .sort({ paidAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          platformEarnings,
          transactionCount: paidTuitions.length,
          averageTransaction: paidTuitions.length > 0 ? totalRevenue / paidTuitions.length : 0,
          growthRate: growth.toFixed(1)
        },
        recentTransactions: recentTransactions.map(t => ({
          id: t._id,
          transactionId: t.paymentIntentId,
          user: t.postedBy?.name || 'Unknown',
          amount: t.totalFee,
          date: t.paidAt,
          title: t.title
        })),
        stats: {
          dailyRevenue: await getDailyRevenue(),
          weeklyRevenue: await getWeeklyRevenue(),
          monthlyRevenue: await getMonthlyRevenue()
        }
      }
    });

  } catch (error) {
    console.error('Revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue data'
    });
  }
};


export const getSimpleTransactions = async (req, res) => {
    console.log( 'i am calling 2')
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      paymentStatus: 'paid',
      paymentIntentId: { $exists: true, $ne: null }
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'postedBy.name': { $regex: search, $options: 'i' } },
        { paymentIntentId: { $regex: search, $options: 'i' } }
      ];
    }

    const [transactions, total] = await Promise.all([
      Tutions.find(filter)
        .populate('postedBy', 'name email role')
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Tutions.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t._id,
          transactionId: t.paymentIntentId,
          user: {
            name: t.postedBy?.name || 'Unknown',
            email: t.postedBy?.email,
            role: t.postedBy?.role
          },
          amount: t.totalFee,
          platformFee: t.totalFee * 0.1,
          netAmount: t.totalFee * 0.9,
          status: 'completed',
          date: t.paidAt,
          tuitionTitle: t.title,
          grade: t.grade,
          subjects: t.subjects
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};


export const getRevenueTrend = async (req, res) => {
    console.log( 'i am calling 3')
  try {
    const { period = 'monthly', limit = 12 } = req.query;

    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
        break;
      case 'weekly':
        groupBy = { $dateToString: { format: '%Y-%U', date: '$paidAt' } };
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paidAt' } };
        break;
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paidAt' } };
    }

    const revenueTrend = await Tutions.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paymentIntentId: { $exists: true, $ne: null },
          paidAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalFee' },
          transactions: { $sum: 1 },
          averageAmount: { $avg: '$totalFee' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: parseInt(limit) },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueTrend.map(item => ({
        period: item._id,
        revenue: item.revenue,
        transactions: item.transactions,
        averageAmount: item.averageAmount
      }))
    });

  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trend'
    });
  }
};


async function getDailyRevenue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Tutions.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        paymentIntentId: { $exists: true, $ne: null },
        paidAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalFee' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { revenue: 0, count: 0 };
}

async function getWeeklyRevenue() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const result = await Tutions.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        paymentIntentId: { $exists: true, $ne: null },
        paidAt: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalFee' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { revenue: 0, count: 0 };
}

async function getMonthlyRevenue() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const result = await Tutions.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        paymentIntentId: { $exists: true, $ne: null },
        paidAt: { $gte: oneMonthAgo }
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalFee' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { revenue: 0, count: 0 };
}


export const exportRevenueReport = async (req, res) => {
  try {
      console.log( 'i am calling 4')
    const { format = 'json' } = req.body;
    
    const paidTuitions = await Tutions.find({
      paymentStatus: 'paid',
      paymentIntentId: { $exists: true, $ne: null }
    })
      .populate('postedBy', 'name email')
      .sort({ paidAt: -1 });

    const report = {
      generatedAt: new Date(),
      totalRevenue: paidTuitions.reduce((sum, t) => sum + t.totalFee, 0),
      totalTransactions: paidTuitions.length,
      transactions: paidTuitions.map(t => ({
        id: t._id,
        transactionId: t.paymentIntentId,
        date: t.paidAt,
        student: t.postedBy?.name,
        email: t.postedBy?.email,
        title: t.title,
        amount: t.totalFee,
        platformFee: t.totalFee * 0.1,
        tutorEarnings: t.totalFee * 0.9
      }))
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${Date.now()}.json"`);
      return res.send(JSON.stringify(report, null, 2));
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
};