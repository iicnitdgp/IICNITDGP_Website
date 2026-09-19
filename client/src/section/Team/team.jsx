import React, { useState, useEffect } from "react";
import TeamCard from "../../component/TeamCard/Card";
import styles from "./styles/team.module.scss";
import teamData from "../../../public/data/member.json";
import GradientText from "../../component/Core/TextStyle";
import apiService from "../../services/apiService";

const Team = () => {
        // Designation order for sorting within each group
    // Designation order for sorting within each group (exact matches first, then keyword matches)
    const designationOrder = [
        // Exact matches (these always come first)
        "president",
        "convenor",
        "treasurer",
        "assistent treasurer",
        "student convener",
        "innovation coordinator",
        "internship coordinator",
        "start-up coordinator",
        "ipr coordinator",
        "website coordinator",
        "content head",
        "social media head",
        // Keyword matches (these come after all exact matches)
        "web", // anything related to website/web development
        "graphic", // anything related to graphic design
        "video",   // anything related to video
        "content"  // anything related to content
    ];

    // Helper: returns [orderIndex, isExactMatch] for sorting
    // Types that should always come last if not a defined designation/keyword
    const alwaysLastRegex = [
        /\bfaculty\b/i,
        /assistant professor/i,
        /student council/i,
        /student volunteer/i,
        /advisor/i,
        /mentor/i,
        /\bother\b/i,
        /\bmember\b/i
    ];

    function getDesignationOrder(designation = "", type = "") {
        // 0. If both designation and type are empty/undefined, put at the very end
        if (!designation && !type) return [20000, false];
        // 1. Check for exact match (highest priority)
        const lower = (designation || "").trim().toLowerCase();
        for (let i = 0; i < 12; i++) {
            if (lower === designationOrder[i]) return [i, true];
        }
        // 2. Check for keyword/regex match (lower priority)
        const regexMap = [
            /web(\s|$|site|dev|developer|development|team|member)/i,
            /graphic(\s|$|design|designer|designing|team|member)/i,
            /video(\s|$|edit|editor|editing|production|team|member)?/i,
            /content(\s|$|writer|creation|creator|manager|team|member)?/i
        ];
        for (let j = 0; j < regexMap.length; j++) {
            if (regexMap[j].test(designation)) return [12 + j, false];
        }
        // 3. If designation or type matches any alwaysLastRegex, put after all designations/keywords and unknowns
        if (alwaysLastRegex.some(rgx => rgx.test(designation) || rgx.test(type))) return [10000, false];
        // 4. If not found, put at the end (but before alwaysLastTypes and truly undefined)
        return [999, false];
    }
    const [selectedType, setSelectedType] = useState("All");
    const [showFilters] = useState(true); // State for showing filters
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch users from backend and merge with JSON data
    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);
                
                // Fetch users from backend (only active users with type and designation)
                const response = await apiService.request('/team-members?limit=100');
                
                const data = await response.json();
                // console.log('Backend team members response:', data);
                // console.log('Number of users from backend:', data.users?.length || 0);
                
                let backendUsers = [];
                if (data.success && data.users) {
                    // Transform backend users to match the expected format
                    // Don't filter here - let's see what we get and transform what we can
                    backendUsers = data.users.map(user => {
                        // console.log('Processing user:', user.name, {
                        //     hasType: !!user.type,
                        //     hasDesignation: !!user.designation,
                        //     isActive: user.isActive
                        // });
                        
                        return {
                            id: user._id,
                            name: user.name,
                            role: user.designation || user.type || 'Member', // Fallback to type or 'Member'
                            img: user.photo || 'https://via.placeholder.com/150', // Fallback image
                            type: user.type || 'Other', // Fallback to 'Other'
                            extra: {
                                linkedin: user.extra?.linkedin || "",
                                github: user.extra?.github || "",
                                designation: user.designation || user.type || 'Member'
                            }
                        };
                    });
                }

                // Combine JSON data with backend users
                const combinedData = [...teamData, ...backendUsers];
                // console.log('Combined data length:', combinedData.length);
                // console.log('JSON data length:', teamData.length);
                // console.log('Backend users length:', backendUsers.length);
                
                // Remove duplicates based on name (prioritize backend data)
                const uniqueMembers = combinedData.reduce((acc, current) => {
                    const existingIndex = acc.findIndex(item => 
                        item.name.toLowerCase() === current.name.toLowerCase()
                    );
                    
                    if (existingIndex >= 0) {
                        // If backend user (has _id), replace the JSON entry
                        if (typeof current.id === 'string' && current.id.length === 24) {
                            console.log('Replacing JSON entry with backend user:', current.name);
                            acc[existingIndex] = current;
                        }
                    } else {
                        acc.push(current);
                    }
                    
                    return acc;
                }, []);

                // console.log('Final unique members length:', uniqueMembers.length);
                setAllMembers(uniqueMembers);
            } catch (error) {
                console.error('Error fetching team data:', error);
                // Fallback to JSON data only
                setAllMembers(teamData);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    // Group members by type
    const groupedMembers = allMembers.reduce((acc, member) => {
        const { type } = member;
        if (!acc[type]) acc[type] = [];
        acc[type].push(member);
        return acc;
    }, {});

    // Define the order for displaying team sections (Advisor first - Director NIT Durgapur)
    const typeOrder = ['Advisor', 'Faculty', 'Student Council', 'Student Volunteers', 'Mentor'];
    
    // Get ordered types (predefined order first, then any remaining types)
    const orderedTypes = [
        ...typeOrder.filter(type => groupedMembers[type]),
        ...Object.keys(groupedMembers).filter(type => !typeOrder.includes(type))
    ];

    // Handler for filter buttons
    const handleFilterClick = (type) => {
        setSelectedType(type);
    };

    if (loading) {
        return (
            <div className={styles.teamPage}>
                <div className={styles.loadingContainer}>
                    <p>Loading team members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.teamPage}>
            <h2 className={styles.teamTitle}>
                <div>Meet Our <span style={{
                    background: "var(--primary)",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                }}>Team</span></div>
                <div className={styles.bottomLine}></div>
            </h2>


            {/* Filter buttons */}
            {showFilters && (
                <div className={styles.filterButtons}>
                    {["All", ...orderedTypes].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterClick(type)}
                            className={`${styles.filterButton} ${selectedType === type ? styles.active : ""}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            {/* Display team members based on selected type, sorted by designation order */}
            {orderedTypes.map((type) => (
                (selectedType === "All" || selectedType === type) && (
                    <div key={type} className={styles.teamSection}>
                        <h3 className={styles.teamSectionTitle}>
                            <span style={{
                                background: "var(--primary)",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                            }}>{type}</span>
                        </h3>
                        <div className={styles.teamGrid}>
                                                        {groupedMembers[type]
                                                            .slice() // avoid mutating original
                                                            .sort((a, b) => {
                                                                const [aIdx, aExact] = getDesignationOrder(a.extra?.designation || a.role || "", a.type || "");
                                                                const [bIdx, bExact] = getDesignationOrder(b.extra?.designation || b.role || "", b.type || "");
                                                                // Exact matches always come before keyword matches at the same index
                                                                if (aIdx === bIdx) {
                                                                    if (aExact && !bExact) return -1;
                                                                    if (!aExact && bExact) return 1;
                                                                    return 0;
                                                                }
                                                                return aIdx - bIdx;
                                                            })
                                                            .map((member) => (
                                                                <TeamCard key={member.id} member={member} />
                                                        ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

export default Team;
